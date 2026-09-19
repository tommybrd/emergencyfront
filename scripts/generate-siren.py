"""Generate an original looping two-tone sample, without external recordings."""
from pathlib import Path
import math
import struct
import wave


def generate(path):
    rate, duration, phase = 22050, 2.0, 0.0
    frames = bytearray()
    for i in range(round(rate * duration)):
        t = i / rate
        part = t % 0.5
        frequency = 435 if int(t / 0.5) % 2 == 0 else 488
        phase += 2 * math.pi * frequency / rate
        envelope = min(1, part / 0.012, (0.5 - part) / 0.012)
        sample = (math.sin(phase) + 0.20 * math.sin(phase * 3)) * envelope * 0.45
        frames += struct.pack('<h', round(32767 * sample))
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(frames)


if __name__ == '__main__':
    generate(Path(__file__).resolve().parents[1] / 'dist' / 'deux-tons.wav')
