"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Avatar } from "@/components/ui";
import { api } from "@/lib/client";
import { toast } from "@/components/toast";

/**
 * Real 1:1 WebRTC voice/video calling. Signaling (offer/answer/ICE) is relayed through the
 * database via /api/calls (short-polled every ~900ms) — no extra infra to run. Uses Google's
 * public STUN servers for NAT traversal. On very restrictive/carrier-grade NAT networks a TURN
 * server would be needed for a reliable connection; none is configured here (see README).
 */
const ICE_SERVERS: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
const POLL_MS = 900;

type CallInfo = { id: string; status: string; video: boolean; isCaller: boolean; peer: { username: string; displayName: string; avatarUrl: string | null } };
type Phase = "starting" | "calling" | "connecting" | "connected" | "ended";

export default function CallPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const search = useSearchParams();
  const router = useRouter();
  const existingId = search.get("id");
  const wantsVideo = search.get("video") === "1";

  const [phase, setPhase] = useState<Phase>("starting");
  const [info, setInfo] = useState<CallInfo | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [error, setError] = useState("");

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const callId = useRef<string | null>(existingId);
  const since = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ended = useRef(false);
  const madeOffer = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        // 1) Get (or create) the call row.
        let call: CallInfo;
        if (existingId) {
          const r = await api<{ call: CallInfo }>(`/api/calls/${existingId}`);
          call = r.call;
        } else {
          const created = await api<{ call: { id: string; video: boolean } }>("/api/calls", { method: "POST", json: { username, video: wantsVideo } });
          callId.current = created.call.id;
          const r = await api<{ call: CallInfo }>(`/api/calls/${created.call.id}`);
          call = r.call;
        }
        if (cancelled) return;
        callId.current = call.id;
        setInfo(call);
        setPhase(call.isCaller ? "calling" : "connecting");

        // 2) Local media.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.video ? { facingMode: "user" } : false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStream.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;

        // 3) Peer connection.
        const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pc.current = conn;
        stream.getTracks().forEach((t) => conn.addTrack(t, stream));
        conn.ontrack = (e) => { if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0]; setPhase("connected"); };
        conn.onconnectionstatechange = () => { if (conn.connectionState === "failed") setError("Connection failed — the network may be blocking peer-to-peer calls."); };
        conn.onicecandidate = (e) => { if (e.candidate) void api(`/api/calls/${callId.current}/signal`, { method: "POST", json: { kind: "candidate", payload: JSON.stringify(e.candidate) } }).catch(() => {}); };

        // Caller makes the offer immediately; callee waits for it via polling.
        if (call.isCaller && !madeOffer.current) {
          madeOffer.current = true;
          const offer = await conn.createOffer();
          await conn.setLocalDescription(offer);
          await api(`/api/calls/${callId.current}/signal`, { method: "POST", json: { kind: "offer", payload: JSON.stringify(offer) } });
        }

        poll();
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.name === "NotAllowedError" ? "Camera/microphone permission was denied." : e?.message || "Couldn't start the call.");
      }
    }

    async function poll() {
      if (cancelled || ended.current || !callId.current) return;
      try {
        const r = await api<{ call: CallInfo; signals: Array<{ kind: string; payload: string; at: number }>; serverNow: number }>(`/api/calls/${callId.current}?since=${since.current}`);
        setInfo(r.call);
        for (const s of r.signals) {
          since.current = Math.max(since.current, s.at);
          await handleSignal(s.kind, s.payload);
        }
        if (r.call.status === "DECLINED" || r.call.status === "MISSED" || r.call.status === "ENDED") { finish(r.call.status); return; }
      } catch { /* transient — keep polling */ }
      pollTimer.current = setTimeout(poll, POLL_MS);
    }

    async function handleSignal(kind: string, payload: string) {
      const conn = pc.current; if (!conn) return;
      try {
        if (kind === "offer") {
          await conn.setRemoteDescription(JSON.parse(payload));
          const answer = await conn.createAnswer();
          await conn.setLocalDescription(answer);
          await api(`/api/calls/${callId.current}/signal`, { method: "POST", json: { kind: "answer", payload: JSON.stringify(answer) } });
          setPhase("connecting");
        } else if (kind === "answer") {
          if (!conn.currentRemoteDescription) await conn.setRemoteDescription(JSON.parse(payload));
          setPhase("connecting");
        } else if (kind === "candidate") {
          await conn.addIceCandidate(JSON.parse(payload)).catch(() => {});
        } else if (kind === "hangup") {
          finish("ENDED");
        }
      } catch { /* ignore malformed/late signals */ }
    }

    function finish(status: string) {
      if (ended.current) return;
      ended.current = true;
      setPhase("ended");
      if (pollTimer.current) clearTimeout(pollTimer.current);
      pc.current?.close();
      localStream.current?.getTracks().forEach((t) => t.stop());
      if (status === "DECLINED") toast(`${info?.peer.displayName || "They"} declined the call`);
      if (status === "MISSED") toast("No answer");
      setTimeout(() => router.replace(`/messages/${username}`), 1200);
    }

    void setup();
    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
      if (!ended.current) {
        ended.current = true;
        if (callId.current) void api(`/api/calls/${callId.current}/signal`, { method: "POST", json: { kind: "hangup", payload: "{}" } }).catch(() => {});
        pc.current?.close();
        localStream.current?.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hangUp() {
    if (callId.current) void api(`/api/calls/${callId.current}/action`, { method: "POST", json: { action: "end" } }).catch(() => {});
    if (callId.current) void api(`/api/calls/${callId.current}/signal`, { method: "POST", json: { kind: "hangup", payload: "{}" } }).catch(() => {});
    ended.current = true;
    pc.current?.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    router.replace(`/messages/${username}`);
  }

  function toggleMic() {
    const track = localStream.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled; setMuted(!track.enabled);
  }
  function toggleCam() {
    const track = localStream.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled; setCamOff(!track.enabled);
  }

  const peer = info?.peer;
  const isVideo = info?.video ?? wantsVideo;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-white">
      <div className="relative flex-1 overflow-hidden">
        {isVideo ? (
          <video ref={remoteVideo} autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Avatar name={peer?.displayName || username} src={peer?.avatarUrl} size={110} />
            <p className="text-xl font-bold">{peer?.displayName || username}</p>
          </div>
        )}
        {isVideo && (
          <video ref={localVideo} autoPlay playsInline muted className="absolute right-3 top-3 h-36 w-24 rounded-xl border border-white/20 object-cover shadow-lg" />
        )}
        <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-1 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
          <p className="text-lg font-bold">{peer?.displayName || username}</p>
          <p className="text-sm text-white/70">
            {error ? error : phase === "starting" ? "Starting…" : phase === "calling" ? "Calling…" : phase === "connecting" ? "Connecting…" : phase === "connected" ? "Connected" : "Call ended"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-5 bg-black/40 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button onClick={toggleMic} aria-label={muted ? "Unmute" : "Mute"} className={`grid h-14 w-14 place-items-center rounded-full ${muted ? "bg-white text-slate-900" : "bg-white/15"}`}>{muted ? <MicOff size={22} /> : <Mic size={22} />}</button>
        {isVideo && <button onClick={toggleCam} aria-label={camOff ? "Turn camera on" : "Turn camera off"} className={`grid h-14 w-14 place-items-center rounded-full ${camOff ? "bg-white text-slate-900" : "bg-white/15"}`}>{camOff ? <VideoOff size={22} /> : <Video size={22} />}</button>}
        <button onClick={hangUp} aria-label="End call" className="grid h-16 w-16 place-items-center rounded-full bg-red-500"><PhoneOff size={26} /></button>
      </div>
    </div>
  );
}
