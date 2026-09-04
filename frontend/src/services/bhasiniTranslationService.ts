/**
 * S.I.R.I.S. — Bhasini Multilingual Tri-Module Engine (ASR + NMT + TTS)
 * Integrates Bhasini API for Indian Multilingual Support (Odia, Hindi, Bengali, Marathi, Tamil, Telugu, English)
 */

export type SupportedLanguage = 'en' | 'hi' | 'or' | 'bn' | 'mr' | 'ta' | 'te';

export interface TranslationResponse {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  originalText: string;
  translatedText: string;
  provider: 'BHASINI_API' | 'LOCAL_TRANSLATION_FALLBACK';
}

export interface AsrResponse {
  sourceLanguage: SupportedLanguage;
  transcribedText: string;
  provider: 'BHASINI_ASR_API' | 'LOCAL_ASR_FALLBACK';
}

export interface TtsResponse {
  language: SupportedLanguage;
  audioBase64?: string;
  audioUrl?: string;
  provider: 'BHASINI_TTS_API' | 'LOCAL_TTS_SYNTHESIS';
}

const BHASINI_API_KEY = import.meta.env.VITE_BHASINI_API_KEY || '-_oVT-BJc9miqpgS6SpTTixyQGXhebibkgsI3CTmelTau7QuQxT_Mnl1R7MgWy8h';
const BHASINI_UDYAT_KEY = import.meta.env.VITE_BHASINI_UDYAT_KEY || '36bcfef5a1-1c64-4bd1-ba20-329f198c0ed2';
const BHASINI_API_URL = import.meta.env.VITE_BHASINI_API_URL || 'https://dhruva-api.bhasini.gov.in/services/inference/pipeline';
const BHASINI_TRANSLATION_URL = 'https://dhruva-api.bhasini.gov.in/services/inference/translation';

// Local offline translation dictionary for Indian Languages (Crime & Legal Terminology)
const CRIME_TRANSLATION_DICTIONARY: Record<SupportedLanguage, Record<string, string>> = {
  en: {},
  hi: {
    'Executive Summary & Threat Assessment': 'कार्यकारी सारांश और खतरा मूल्यांकन',
    'Financial Crime & Money Trail Agent': 'वित्तीय अपराध और धन हस्तांतरण एजेंट',
    'Telecom & CDR Intelligence Agent': 'दूरसंचार और सीडीआर इंटेलिजेंस एजेंट',
    'Statutory & Legal Enforcement Agent': 'वैधानिक और कानूनी प्रवर्तन एजेंट',
    'HIGH THREAT': 'उच्च खतरा',
    'MEDIUM THREAT': 'मध्यम खतरा',
    'LOW THREAT': 'कम खतरा',
    'Mule Account Detected': 'खच्चर (म्यूल) खाता पाया गया',
    'High-Frequency Nocturnal Contact': 'उच्च आवृत्ति रात्रि संपर्क',
    'BNSS Section 105 Seizure Action': 'बीएनएसएस धारा 105 जब्ती कार्रवाई',
    'Freeze Account under BNSS 107': 'बीएनएसएस 107 के तहत खाता फ्रीज करें',
    'Suspect Identified': 'संदेही की पहचान की गई',
  },
  or: {
    'Executive Summary & Threat Assessment': 'କାର୍ଯ୍ୟକାରୀ ସାରାଂଶ ଓ ସଙ୍କଟ ମୂଲ୍ୟାଙ୍କନ',
    'Financial Crime & Money Trail Agent': 'ଆର୍ଥିକ ଅପରାଧ ଓ ଅର୍ଥ ଚାଲାଣ ଏଜେଣ୍ଟ',
    'Telecom & CDR Intelligence Agent': 'ଟେଲିକମ୍ ଓ ସିଡିଆର୍ ଇଣ୍ଟେଲିଜେନ୍ସ ଏଜେଣ୍ଟ',
    'Statutory & Legal Enforcement Agent': 'ଆଇନଗତ ଓ ଆଇନ ପ୍ରବର୍ତ୍ତନ ଏଜେଣ୍ଟ',
    'HIGH THREAT': 'ଉଚ୍ଚ ସଙ୍କଟ',
    'MEDIUM THREAT': 'ମଧ୍ୟମ ସଙ୍କଟ',
    'LOW THREAT': 'କମ୍ ସଙ୍କଟ',
    'Mule Account Detected': 'ମ୍ୟୁଲ୍ ଆକାଉଣ୍ଟ୍ ଚିହ୍ନଟ ହୋଇଛି',
    'High-Frequency Nocturnal Contact': 'ରାତ୍ରିକାଳୀନ ଉଚ୍ଚ ଫ୍ରିକ୍ୱେନ୍ସି ଯୋଗାଯୋଗ',
    'BNSS Section 105 Seizure Action': 'ବିଏନ୍ଏସ୍ଏସ୍ ଧାରା ୧୦୫ ଜବତ କାର୍ଯ୍ୟାନୁଷ୍ଠାନ',
    'Freeze Account under BNSS 107': 'ବିଏନ୍ଏସ୍ଏସ୍ ୧୦୭ ଅଧୀନରେ ଆକାଉଣ୍ଟ୍ ଫ୍ରିଜ୍',
    'Suspect Identified': 'ସନ୍ଦିଗ୍ଧ ଚିହ୍ନଟ',
  },
  bn: {
    'Executive Summary & Threat Assessment': 'নির্বাহী সারাংশ এবং হুমকি মূল্যায়ন',
    'Financial Crime & Money Trail Agent': 'আর্থিক অপরাধ এবং মানি ট্রেইল এজেন্ট',
    'Telecom & CDR Intelligence Agent': 'টেলিকম এবং সিডিআর গোয়েন্দা এজেন্ট',
    'Statutory & Legal Enforcement Agent': 'সংবিধিবদ্ধ ও আইনি প্রয়োগকারী এজেন্ট',
    'HIGH THREAT': 'উচ্চ হুমকি',
    'MEDIUM THREAT': 'মাঝারি হুমকি',
    'LOW THREAT': 'কম হুমকি',
    'Mule Account Detected': 'মুল অ্যাকাউন্ট শনাক্ত হয়েছে',
    'High-Frequency Nocturnal Contact': 'উচ্চ-কম্পাঙ্কের নৈশ যোগাযোগ',
    'BNSS Section 105 Seizure Action': 'বিএনএসএস ধারা ১০৫ জব্দকরণ পদক্ষেপ',
    'Freeze Account under BNSS 107': 'বিএনএসএস ১০৭ অনুযায়ী অ্যাকাউন্ট ফ্রিজ',
    'Suspect Identified': 'সন্দেহভাজন চিহ্নিত',
  },
  mr: {
    'Executive Summary & Threat Assessment': 'कार्यकारी सारांश आणि धोका मूल्यमापन',
    'Financial Crime & Money Trail Agent': 'आर्थिक गुन्हा आणि मनी ट्रेल एजंट',
    'Telecom & CDR Intelligence Agent': 'टेलिकॉम आणि सीडीआर इंटेलिजन्स एजंट',
    'Statutory & Legal Enforcement Agent': 'वैधानिक आणि कायदेशीर अंमलबजावणी एजंट',
    'HIGH THREAT': 'उच्च धोका',
    'MEDIUM THREAT': 'मध्यम धोका',
    'LOW THREAT': 'कमी धोका',
    'Mule Account Detected': 'म्युल खाते आढळले',
    'High-Frequency Nocturnal Contact': 'उच्च वारंवारता रात्रीचा संपर्क',
    'BNSS Section 105 Seizure Action': 'बीएनएसएस कलम १०५ जप्ती कारवाई',
    'Freeze Account under BNSS 107': 'बीएनएसएस १०७ अंतर्गत खाते गोठवा',
    'Suspect Identified': 'संशयित ओळखला',
  },
  ta: {
    'Executive Summary & Threat Assessment': 'செயல்முறை சுருக்கம் மற்றும் அச்சுறுத்தல் மதிப்பீடு',
    'Financial Crime & Money Trail Agent': 'நிதி குற்றங்கள் மற்றும் பணப் பாதை முகவர்',
    'HIGH THREAT': 'அதிக அச்சுறுத்தல்',
  },
  te: {
    'Executive Summary & Threat Assessment': 'ఎగ్జిక్యూటివ్ సారాంశం మరియు ముప్పు అంచనా',
    'Financial Crime & Money Trail Agent': 'ఆర్థిక నేరాలు మరియు మనీ ట్రయల్ ఏజెంట్',
    'HIGH THREAT': 'అధిక ముప్పు',
  }
};

export const bhasiniTranslationService = {
  /**
   * 1. NMT: Translates text into target Indian language using Bhasini API with fallback
   */
  async translateText(
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage: SupportedLanguage = 'en'
  ): Promise<TranslationResponse> {
    if (targetLanguage === sourceLanguage || !text.trim()) {
      return {
        sourceLanguage,
        targetLanguage,
        originalText: text,
        translatedText: text,
        provider: 'LOCAL_TRANSLATION_FALLBACK',
      };
    }

    try {
      const response = await fetch(BHASINI_TRANSLATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BHASINI_API_KEY,
          'ulcaApiKey': BHASINI_UDYAT_KEY,
          'userID': BHASINI_UDYAT_KEY,
        },
        body: JSON.stringify({
          pipelineTasks: [
            {
              taskType: 'translation',
              config: {
                language: {
                  sourceLanguage,
                  targetLanguage,
                },
              },
            },
          ],
          inputData: {
            input: [{ source: text }],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data?.pipelineResponse?.[0]?.output?.[0]?.target;
        if (translated) {
          return {
            sourceLanguage,
            targetLanguage,
            originalText: text,
            translatedText: translated,
            provider: 'BHASINI_API',
          };
        }
      }
    } catch (err) {
      console.warn('[BhasiniTranslationService] Bhasini API NMT connection notice:', err);
    }

    // Fallback dictionary replacement for common terms
    let translated = text;
    const dict = CRIME_TRANSLATION_DICTIONARY[targetLanguage] || {};
    Object.entries(dict).forEach(([key, val]) => {
      const regex = new RegExp(key, 'gi');
      translated = translated.replace(regex, val);
    });

    return {
      sourceLanguage,
      targetLanguage,
      originalText: text,
      translatedText: translated,
      provider: 'LOCAL_TRANSLATION_FALLBACK',
    };
  },

  /**
   * 2. ASR (Speech-to-Text): Transcribes recorded microphone audio base64 into text
   */
  async speechToText(
    audioBase64: string,
    sourceLanguage: SupportedLanguage = 'hi'
  ): Promise<AsrResponse> {
    try {
      const response = await fetch(BHASINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BHASINI_API_KEY,
          'ulcaApiKey': BHASINI_UDYAT_KEY,
          'userID': BHASINI_UDYAT_KEY,
        },
        body: JSON.stringify({
          pipelineTasks: [
            {
              taskType: 'asr',
              config: {
                language: {
                  sourceLanguage,
                },
                serviceId: '',
                audioFormat: 'wav',
                samplingRate: 16000,
              },
            },
          ],
          inputData: {
            audio: [{ audioContent: audioBase64 }],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const transcribed = data?.pipelineResponse?.[0]?.output?.[0]?.source;
        if (transcribed) {
          return {
            sourceLanguage,
            transcribedText: transcribed,
            provider: 'BHASINI_ASR_API',
          };
        }
      }
    } catch (err) {
      console.warn('[BhasiniTranslationService] Bhasini ASR API notice:', err);
    }

    // Fallback sample transcription for demo
    const sampleDict: Record<SupportedLanguage, string> = {
      en: 'On 18 August 2026 at 18:40 hrs near Khandagiri, suspect robbed gold chain and fled on motorcycle.',
      hi: '18 अगस्त 2026 को सायं 18:40 बजे खंडागिरी के पास अभियुक्त ने सोने की चेन छीनी और मोटरसाइकिल से फरार हो गया।',
      or: '୧୮ ଅଗଷ୍ଟ ୨୦୨୬ ସନ୍ଧ୍ୟା ୬:୪୦ ରେ ଖଣ୍ଡଗିରି ନିକଟରେ ଅଭିଯୁକ୍ତ ସୁନା ଚେନ୍ ଛୋଡାଇ ବାଇକ୍‌ରେ ଫେରାର୍ ହୋଇଗଲା।',
      bn: '১৮ আগস্ট ২০২৬ সন্ধ্যা ৬:৪০ টায় খণ্ডগিরির কাছে অভিযুক্ত সোনার চেইন ছিনতাই করে বাইকে পালিয়ে যায়।',
      mr: '१८ ऑगस्ट २०२६ संध्याकाळी ६:४० वाजता खंडागिरी जवळ आरोपीने सोन्याची साखळी हिसकावून पळ काढला.',
      ta: 'ஆகஸ்ட் 18 2026 அன்று இரவு 6:40 மணிக்கு சந்தேக நபர் தங்க சங்கிலியை பறித்து தப்பியோடினார்.',
      te: 'ఆగస్టు 18 2026 సాయంత్రం 6:40 గంటలకు నిందితుడు బంగారు గొలుసును దొంగిలించి పరారయ్యాడు.'
    };

    return {
      sourceLanguage,
      transcribedText: sampleDict[sourceLanguage] || sampleDict.hi,
      provider: 'LOCAL_ASR_FALLBACK',
    };
  },

  /**
   * 3. TTS (Text-to-Speech): Synthesizes text into Indian Language voice audio
   */
  async textToSpeech(
    text: string,
    targetLanguage: SupportedLanguage = 'hi',
    gender: 'female' | 'male' = 'female'
  ): Promise<TtsResponse> {
    try {
      const response = await fetch(BHASINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BHASINI_API_KEY,
          'ulcaApiKey': BHASINI_UDYAT_KEY,
          'userID': BHASINI_UDYAT_KEY,
        },
        body: JSON.stringify({
          pipelineTasks: [
            {
              taskType: 'tts',
              config: {
                language: {
                  sourceLanguage: targetLanguage,
                },
                gender,
              },
            },
          ],
          inputData: {
            input: [{ source: text }],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const audioContent = data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
        if (audioContent) {
          const audioUrl = `data:audio/wav;base64,${audioContent}`;
          return {
            language: targetLanguage,
            audioBase64: audioContent,
            audioUrl,
            provider: 'BHASINI_TTS_API',
          };
        }
      }
    } catch (err) {
      console.warn('[BhasiniTranslationService] Bhasini TTS API notice:', err);
    }

    return {
      language: targetLanguage,
      provider: 'LOCAL_TTS_SYNTHESIS',
    };
  },

  /**
   * Helper: Plays Base64 or Audio Data URL in browser HTML5 Audio
   */
  playAudio(audioUrlOrBase64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const src = audioUrlOrBase64.startsWith('data:') 
        ? audioUrlOrBase64 
        : `data:audio/wav;base64,${audioUrlOrBase64}`;
      const audio = new Audio(src);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  },

  /**
   * Web Speech API SpeechSynthesis Fallback for browser native voice synthesis
   */
  speakNativeSpeechSynthesis(text: string, language: SupportedLanguage = 'hi'): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        or: 'or-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        te: 'te-IN',
      };
      utterance.lang = langMap[language] || 'hi-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }
};
