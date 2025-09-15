// Text-to-Speech utility for Japanese vocabulary
export interface SpeechVoice {
  name: string;
  lang: string;
  gender: 'male' | 'female';
  rate: number;
  pitch: number;
}

// Japanese voices configuration
export const JAPANESE_VOICES: SpeechVoice[] = [
  {
    name: 'Google 日本語 (Female)',
    lang: 'ja-JP',
    gender: 'female',
    rate: 0.9,
    pitch: 1.0
  },
  {
    name: 'Google 日本語 (Male)',
    lang: 'ja-JP',
    gender: 'male',
    rate: 0.8,
    pitch: 0.9
  },
  {
    name: 'Microsoft Haruka',
    lang: 'ja-JP',
    gender: 'female',
    rate: 1.0,
    pitch: 1.1
  },
  {
    name: 'Microsoft Ichiro',
    lang: 'ja-JP',
    gender: 'male',
    rate: 0.9,
    pitch: 0.8
  }
];

class SpeechService {
  private speechSynthesis: SpeechSynthesis;
  private currentVoice: SpeechVoice | null = null;
  private currentVoiceIndex: number = 0;
  private isSupported: boolean = false;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.initializeVoice();
  }

  private initializeVoice() {
    if (!this.isSupported) return;

    // Wait for voices to load
    const loadVoices = () => {
      const voices = this.speechSynthesis.getVoices();
      const japaneseVoices = voices.filter(voice => 
        voice.lang.startsWith('ja') || voice.lang === 'ja-JP'
      );

      if (japaneseVoices.length > 0) {
        // Use the first available Japanese voice
        this.currentVoice = {
          name: japaneseVoices[0].name,
          lang: japaneseVoices[0].lang,
          gender: japaneseVoices[0].name.toLowerCase().includes('female') || 
                  japaneseVoices[0].name.toLowerCase().includes('女') ? 'female' : 'male',
          rate: 0.9,
          pitch: 1.0
        };
      }
    };

    if (this.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      this.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }
  }

  public isSpeechSupported(): boolean {
    return this.isSupported;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported) return [];
    return this.speechSynthesis.getVoices().filter(voice => 
      voice.lang.startsWith('ja') || voice.lang === 'ja-JP'
    );
  }

  public speak(text: string, voiceIndex: number = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = this.getAvailableVoices();
      
      if (voices.length > 0) {
        const selectedVoice = voices[voiceIndex % voices.length];
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = 'ja-JP';
      }

      // Configure speech parameters
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`));

      this.speechSynthesis.speak(utterance);
    });
  }

  public speakWithRandomVoice(text: string): Promise<void> {
    const voices = this.getAvailableVoices();
    const randomIndex = Math.floor(Math.random() * voices.length);
    return this.speak(text, randomIndex);
  }

  public getCurrentVoiceIndex(): number {
    return this.currentVoiceIndex;
  }

  public setVoiceIndex(index: number): void {
    const voices = this.getAvailableVoices();
    if (voices.length > 0) {
      this.currentVoiceIndex = index % voices.length;
    }
  }

  public getCurrentVoice(): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    return voices[this.currentVoiceIndex] || null;
  }

  public speakWithCurrentVoice(text: string): Promise<void> {
    return this.speak(text, this.currentVoiceIndex);
  }

  public nextVoice(): void {
    const voices = this.getAvailableVoices();
    if (voices.length > 0) {
      this.currentVoiceIndex = (this.currentVoiceIndex + 1) % voices.length;
    }
  }

  public previousVoice(): void {
    const voices = this.getAvailableVoices();
    if (voices.length > 0) {
      this.currentVoiceIndex = this.currentVoiceIndex === 0 
        ? voices.length - 1 
        : this.currentVoiceIndex - 1;
    }
  }

  public stop(): void {
    if (this.isSupported) {
      this.speechSynthesis.cancel();
    }
  }

  public pause(): void {
    if (this.isSupported) {
      this.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.isSupported) {
      this.speechSynthesis.resume();
    }
  }
}

// Export singleton instance
export const speechService = new SpeechService();

// Hook for React components
export const useSpeech = () => {
  const speak = (text: string, voiceIndex?: number) => {
    return speechService.speak(text, voiceIndex);
  };

  const speakRandom = (text: string) => {
    return speechService.speakWithRandomVoice(text);
  };

  const speakWithCurrentVoice = (text: string) => {
    return speechService.speakWithCurrentVoice(text);
  };

  const stop = () => {
    speechService.stop();
  };

  const nextVoice = () => {
    speechService.nextVoice();
  };

  const previousVoice = () => {
    speechService.previousVoice();
  };

  const setVoiceIndex = (index: number) => {
    speechService.setVoiceIndex(index);
  };

  const isSupported = speechService.isSpeechSupported();
  const availableVoices = speechService.getAvailableVoices();
  const currentVoice = speechService.getCurrentVoice();
  const currentVoiceIndex = speechService.getCurrentVoiceIndex();

  return {
    speak,
    speakRandom,
    speakWithCurrentVoice,
    stop,
    nextVoice,
    previousVoice,
    setVoiceIndex,
    isSupported,
    availableVoices,
    currentVoice,
    currentVoiceIndex
  };
};
