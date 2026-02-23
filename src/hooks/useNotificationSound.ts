import { useEffect, useRef, useCallback } from "react";

const NOTIFICATION_SOUND_URL = "https://cdn.pixabay.com/audio/2022/12/12/audio_e8c0a75e6a.mp3";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay before user interaction - silently ignore
      });
    }
  }, []);

  return play;
}
