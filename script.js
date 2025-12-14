// ============================================
// SWASTHYA AI - ENHANCED WITH MULTILINGUAL FEATURES
// ============================================

// DOM Elements
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const feedbackText = document.getElementById('feedbackText');
const formScoreElement = document.getElementById('formScore');
const repCountElement = document.getElementById('repCount');
const sessionTimeElement = document.getElementById('sessionTime');
const caloriesElement = document.getElementById('calories');
const leftKneeAngleElement = document.getElementById('leftKneeAngle');
const rightKneeAngleElement = document.getElementById('rightKneeAngle');
const hipAngleElement = document.getElementById('hipAngle');
const backStraightnessElement = document.getElementById('backStraightness');
const statusIndicator = document.getElementById('statusIndicator');

// Buttons
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const calibrateBtn = document.getElementById('calibrateBtn');
const resetBtn = document.getElementById('resetBtn');
const audioToggle = document.getElementById('audioToggle');
const exerciseBtns = document.querySelectorAll('.exercise-btn');

// Language Settings
let currentLanguage = localStorage.getItem('swasthyaai_language') || 'en';
const availableLanguages = ['en', 'hi', 'mr', 'ta', 'te'];
const languageNames = {
    'en': 'English',
    'hi': 'हिन्दी',
    'mr': 'मराठी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు'
};

// Pose detection variables
let pose = null;
let camera = null;
let isRunning = false;
let sessionStartTime = null;
let sessionTimer = null;
let currentExercise = 'squats';

// Exercise tracking
let repCount = 0;
let inRepPosition = false;
let lastFeedbackTime = 0;
let formScores = [];
let caloriesBurned = 0;

// Real-time angle tracking
let currentAngles = {
    leftKnee: 0,
    rightKnee: 0,
    leftHip: 0,
    rightHip: 0,
    leftElbow: 0,
    rightElbow: 0,
    backAngle: 0
};

// Multilingual Feedback Database
const feedbackMessages = {
    en: {
        ready: "AI system ready. Start your exercise when ready.",
        starting: "Starting exercise monitoring in 3, 2, 1... Begin!",
        stopped: "Session stopped. Good work!",
        perfect_form: "Perfect form! Keep going!",
        knee_alignment: "Keep your knees aligned with your toes.",
        back_straight: "Keep your back straight during the movement.",
        too_shallow: "Go deeper into your squat for better results.",
        too_deep: "Don't go too deep, protect your knees.",
        knee_collapse: "Don't let your knees collapse inward.",
        good_depth: "Excellent depth! Maintain this range.",
        rep_completed: (count) => `Great! ${count} repetitions completed.`,
        session_summary: (reps, score) => `Session complete! ${reps} reps with ${score}% average form.`,
        calibration: "Calibrating... Please stand 2 meters away from camera.",
        system_error: "System error. Please check your camera connection."
    },
    hi: {
        ready: "एआई सिस्टम तैयार है। जब तैयार हों तो अपना व्यायाम शुरू करें।",
        starting: "व्यायाम की निगरानी शुरू हो रही है: ३, २, १... शुरू करें!",
        stopped: "सत्र बंद हुआ। अच्छा काम किया!",
        perfect_form: "बिल्कुल सही फॉर्म! जारी रखें!",
        knee_alignment: "अपने घुटनों को पैर की उंगलियों के साथ संरेखित रखें।",
        back_straight: "आंदोलन के दौरान अपनी पीठ सीधी रखें।",
        too_shallow: "बेहतर परिणामों के लिए अपने स्क्वाट में और गहराई तक जाएं।",
        too_deep: "बहुत गहराई तक न जाएं, अपने घुटनों की सुरक्षा करें।",
        knee_collapse: "अपने घुटनों को अंदर की ओर गिरने न दें।",
        good_depth: "उत्कृष्ट गहराई! इस सीमा को बनाए रखें।",
        rep_completed: (count) => `बहुत बढ़िया! ${count} पुनरावृत्ति पूरी हुई।`,
        session_summary: (reps, score) => `सत्र पूरा हुआ! ${reps} पुनरावृत्ति ${score}% औसत फॉर्म के साथ।`,
        calibration: "कैलिब्रेटिंग... कृपया कैमरे से 2 मीटर दूर खड़े हों।",
        system_error: "सिस्टम त्रुटि। कृपया अपना कैमरा कनेक्शन जांचें।"
    },
    mr: {
        ready: "एआई प्रणाली तयार आहे. तयार असल्यावर आपला व्यायाम सुरू करा.",
        starting: "व्यायामाचे निरीक्षण सुरू होत आहे: ३, २, १... सुरू करा!",
        stopped: "सत्र थांबले. चांगले काम केले!",
        perfect_form: "परफेक्ट फॉर्म! सुरू ठेवा!",
        knee_alignment: "तुमच्या गुडघ्या पायाच्या बोटांशी संरेखित ठेवा.",
        back_straight: "हालचाली दरम्यान आपली पाठीण सरळ ठेवा.",
        too_shallow: "चांगल्या निकालांसाठी तुमच्या स्क्वॅटमध्ये खोलवर जा.",
        too_deep: "खूप खोल जाऊ नका, तुमच्या गुडघ्यांचे रक्षण करा.",
        knee_collapse: "तुमचे गुडघे आत कोसळू देऊ नका.",
        good_depth: "उत्कृष्ट खोली! ही श्रेणी राखा.",
        rep_completed: (count) => `छान! ${count} पुनरावृत्ती पूर्ण झाली.`,
        session_summary: (reps, score) => `सत्र पूर्ण! ${reps} पुनरावृत्ती ${score}% सरासरी फॉर्म सह.`,
        calibration: "कॅलिब्रेटिंग... कृपया कॅमेरापासून 2 मीटर अंतरावर उभे राहा.",
        system_error: "प्रणाली त्रुटी. कृपया आपला कॅमेरा कनेक्शन तपासा."
    },
    ta: {
        ready: "AI அமைப்பு தயார். நீங்கள் தயாராக இருக்கும்போது உங்கள் உடற்பயிற்சியைத் தொடங்கவும்.",
        starting: "உடற்பயிற்சி கண்காணிப்பு தொடங்குகிறது: 3, 2, 1... தொடங்கு!",
        stopped: "அமர்வு நிறுத்தப்பட்டது. நல்ல வேலை!",
        perfect_form: "சரியான வடிவம்! தொடர்ந்து செல்லுங்கள்!",
        knee_alignment: "உங்கள் முழங்கால்களை கால் விரல்களுடன் சீரமைக்கவும்.",
        back_straight: "இயக்கத்தின் போது உங்கள் முதுகை நேராக வைத்திருங்கள்.",
        too_shallow: "சிறந்த முடிவுகளுக்கு உங்கள் squat இல் ஆழமாகச் செல்லுங்கள்.",
        too_deep: "மிகவும் ஆழமாக செல்லாதீர்கள், உங்கள் முழங்கால்களைப் பாதுகாக்கவும்.",
        knee_collapse: "உங்கள் முழங்கால்களை உள்ளே விழாதவாறு பார்த்துக் கொள்ளுங்கள்.",
        good_depth: "சிறந்த ஆழம்! இந்த வரம்பை பராமரிக்கவும்.",
        rep_completed: (count) => `நன்றாக இருக்கிறது! ${count} மறுபடியும் முடிந்தது.`,
        session_summary: (reps, score) => `அமர்வு முடிந்தது! ${reps} மறுபடியும் ${score}% சராசரி வடிவத்துடன்.`,
        calibration: "அளவீட்டு... கேமராவிலிருந்து 2 மீட்டர் தொலைவில் நில்லுங்கள்.",
        system_error: "அமைப்பு பிழை. உங்கள் கேமரா இணைப்பை சரிபார்க்கவும்."
    },
    te: {
        ready: "AI సిస్టమ్ రెడీ. మీరు సిద్ధంగా ఉన్నప్పుడు మీ వ్యాయామం ప్రారంభించండి.",
        starting: "వ్యాయామ పర్యవేక్షణ ప్రారంభమవుతోంది: 3, 2, 1... ప్రారంభించండి!",
        stopped: "సెషన్ ఆపబడింది. మంచి పని!",
        perfect_form: "పర్ఫెక్ట్ ఫారం! కొనసాగించండి!",
        knee_alignment: "మీ మోకాళ్లను కాలి వేళ్లతో సమలేఖనం చేయండి.",
        back_straight: "చలన సమయంలో మీ వెన్నును నిటారుగా ఉంచండి.",
        too_shallow: "మెరుగైన ఫలితాల కోసం మీ స్క్వాట్లో లోతుగా వెళ్లండి.",
        too_deep: "చాలా లోతుగా వెళ్లవద్దు, మీ మోకాళ్లను రక్షించండి.",
        knee_collapse: "మీ మోకాళ్లు లోపలికి కూలిపోకుండా చూసుకోండి.",
        good_depth: "అద్భుతమైన లోతు! ఈ శ్రేణిని నిర్వహించండి.",
        rep_completed: (count) => `అద్భుతం! ${count} పునరావృతాలు పూర్తయ్యాయి.`,
        session_summary: (reps, score) => `సెషన్ పూర్తయింది! ${reps} పునరావృతాలు ${score}% సగటు ఫారంతో.`,
        calibration: "క్యాలిబ్రేటింగ్... దయచేసి కెమెరా నుండి 2 మీటర్ల దూరంలో నిలబడండి.",
        system_error: "సిస్టమ్ లోపం. దయచేసి మీ కెమెరా కనెక్షన్ తనిఖీ చేయండి."
    }
};

// Exercise configurations
const exerciseConfig = {
    squats: {
        keyJoints: ['leftKnee', 'rightKnee', 'leftHip', 'rightHip'],
        idealAngles: {
            knee: { min: 80, max: 120, perfect: 90 },
            hip: { min: 140, max: 180, perfect: 160 }
        },
        repThreshold: 100
    },
    bicep_curls: {
        keyJoints: ['leftElbow', 'rightElbow'],
        idealAngles: {
            elbow: { min: 30, max: 150, perfect: 90 }
        },
        repThreshold: 120
    },
    shoulder_press: {
        keyJoints: ['leftElbow', 'rightElbow'],
        idealAngles: {
            elbow: { min: 60, max: 180, perfect: 120 }
        },
        repThreshold: 150
    },
    leg_raises: {
        keyJoints: ['leftHip', 'rightHip'],
        idealAngles: {
            hip: { min: 30, max: 90, perfect: 60 }
        },
        repThreshold: 45
    }
};

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing SwasthyaAI...');
    
    try {
        // Add language selector to UI
        addLanguageSelector();
        
        // Initialize MediaPipe Pose
        pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        
        // Configure pose detection
        pose.setOptions({
            modelComplexity: 2, // Increased for better accuracy
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        pose.onResults(onPoseResults);
        
        // Setup camera
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (isRunning) {
                    await pose.send({image: videoElement});
                }
            },
            width: 1280,
            height: 720
        });
        
        await camera.start();
        
        // Setup canvas size
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        console.log('✅ SwasthyaAI initialized successfully!');
        updateFeedback(feedbackMessages[currentLanguage].ready, 'ready');
        
    } catch (error) {
        console.error('Error initializing SwasthyaAI:', error);
        updateFeedback(feedbackMessages[currentLanguage].system_error, 'error');
    }
    
    setupEventListeners();
});

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

function addLanguageSelector() {
    // Check if language selector already exists
    if (document.getElementById('languageSelector')) return;
    
    // Create language selector
    const languageSelector = document.createElement('div');
    languageSelector.id = 'languageSelector';
    languageSelector.className = 'language-selector';
    languageSelector.innerHTML = `
        <select id="languageSelect">
            ${availableLanguages.map(lang => 
                `<option value="${lang}" ${lang === currentLanguage ? 'selected' : ''}>
                    ${languageNames[lang]}
                </option>`
            ).join('')}
        </select>
    `;
    
    // Add to top bar or create one
    const topBar = document.querySelector('.top-bar') || document.querySelector('.exercise-header');
    if (topBar) {
        topBar.appendChild(languageSelector);
    } else {
        // Create a top bar if doesn't exist
        const newTopBar = document.createElement('div');
        newTopBar.className = 'language-top-bar';
        newTopBar.appendChild(languageSelector);
        document.body.insertBefore(newTopBar, document.body.firstChild);
    }
    
    // Add event listener
    document.getElementById('languageSelect').addEventListener('change', function(e) {
        currentLanguage = e.target.value;
        localStorage.setItem('swasthyaai_language', currentLanguage);
        updateFeedback(`Language changed to ${this.options[this.selectedIndex].text}`, 'info');
    });
}

// ============================================
// ENHANCED SKELETON VISUALIZATION WITH ANGLES
// ============================================

function onPoseResults(results) {
    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw video frame with transparency
    canvasCtx.globalAlpha = 0.7;
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.globalAlpha = 1.0;
    
    // If pose landmarks detected
    if (results.poseLandmarks) {
        // Draw enhanced skeleton with angles
        drawEnhancedSkeletonWithAngles(results.poseLandmarks);
        
        // Calculate all joint angles
        calculateAllJointAngles(results.poseLandmarks);
        
        // Analyze exercise form
        analyzeExercise(results.poseLandmarks);
        
        // Display angles on HTML
        updateAngleDisplays();
    }
    
    canvasCtx.restore();
}

function drawEnhancedSkeletonWithAngles(landmarks) {
    // Enhanced color scheme for different body parts
    const colors = {
        torso: '#FF6B6B',      // Red for torso
        leftArm: '#4ECDC4',    // Teal for left arm
        rightArm: '#45B7D1',   // Blue for right arm
        leftLeg: '#96CEB4',    // Green for left leg
        rightLeg: '#FFEAA7',   // Yellow for right leg
        joints: '#FF9FF3',     // Pink for joints
        angleText: '#FFFFFF'   // White for angle text
    };
    
    // Draw all MediaPipe pose connections
    const POSE_CONNECTIONS = [
        // Face
        [10, 9], [9, 8], [8, 6], [6, 5], [5, 4], [4, 0], [0, 1], [1, 2], [2, 3], [3, 7],
        // Torso
        [11, 12], [11, 23], [12, 24], [23, 24],
        // Left Arm
        [11, 13], [13, 15], [15, 17], [17, 19], [19, 15],
        // Right Arm
        [12, 14], [14, 16], [16, 18], [18, 20], [20, 16],
        // Left Leg
        [23, 25], [25, 27], [27, 29], [29, 31], [31, 27],
        // Right Leg
        [24, 26], [26, 28], [28, 30], [30, 32], [32, 28]
    ];
    
    // Draw connections with different colors
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        
        if (start.visibility > 0.5 && end.visibility > 0.5) {
            // Determine connection color based on body part
            let color = colors.torso;
            let lineWidth = 3;
            
            if ((startIdx >= 11 && startIdx <= 16) || (endIdx >= 11 && endIdx <= 16)) {
                // Arms
                color = startIdx % 2 === 0 ? colors.rightArm : colors.leftArm;
                lineWidth = 2;
            } else if ((startIdx >= 23 && startIdx <= 32) || (endIdx >= 23 && endIdx <= 32)) {
                // Legs
                color = startIdx % 2 === 0 ? colors.rightLeg : colors.leftLeg;
                lineWidth = 4;
            }
            
            // Draw connection line
            canvasCtx.strokeStyle = color;
            canvasCtx.lineWidth = lineWidth;
            canvasCtx.lineCap = 'round';
            
            canvasCtx.beginPath();
            canvasCtx.moveTo(start.x * canvasElement.width, start.y * canvasElement.height);
            canvasCtx.lineTo(end.x * canvasElement.width, end.y * canvasElement.height);
            canvasCtx.stroke();
        }
    });
    
    // Draw joints with labels
    landmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.5) {
            const x = landmark.x * canvasElement.width;
            const y = landmark.y * canvasElement.height;
            
            // Draw joint point
            canvasCtx.fillStyle = colors.joints;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
            canvasCtx.fill();
            
            // Add glow effect for key joints
            if ([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(index)) {
                canvasCtx.shadowColor = colors.joints;
                canvasCtx.shadowBlur = 10;
                canvasCtx.beginPath();
                canvasCtx.arc(x, y, 8, 0, 2 * Math.PI);
                canvasCtx.fill();
                canvasCtx.shadowBlur = 0;
            }
            
            // Label key joints
            if ([25, 26, 13, 14, 23, 24].includes(index)) {
                const jointNames = {
                    25: 'L-Knee', 26: 'R-Knee',
                    13: 'L-Elbow', 14: 'R-Elbow',
                    23: 'L-Hip', 24: 'R-Hip'
                };
                
                canvasCtx.fillStyle = colors.angleText;
                canvasCtx.font = 'bold 12px Arial';
                canvasCtx.textAlign = 'center';
                canvasCtx.fillText(jointNames[index], x, y - 15);
            }
        }
    });
    
    // Draw angle arcs for key joints
    drawAngleArcs(landmarks);
}

function drawAngleArcs(landmarks) {
    // Define joints to show angles for
    const angleJoints = [
        { name: 'Knee', points: [23, 25, 27], color: '#FF9FF3', side: 'left' },
        { name: 'Knee', points: [24, 26, 28], color: '#FF9FF3', side: 'right' },
        { name: 'Elbow', points: [11, 13, 15], color: '#4ECDC4', side: 'left' },
        { name: 'Elbow', points: [12, 14, 16], color: '#45B7D1', side: 'right' },
        { name: 'Hip', points: [11, 23, 25], color: '#FF6B6B', side: 'left' },
        { name: 'Hip', points: [12, 24, 26], color: '#FF6B6B', side: 'right' }
    ];
    
    angleJoints.forEach(joint => {
        const [aIdx, bIdx, cIdx] = joint.points;
        
        if (landmarks[aIdx] && landmarks[bIdx] && landmarks[cIdx] &&
            landmarks[aIdx].visibility > 0.5 && 
            landmarks[bIdx].visibility > 0.5 && 
            landmarks[cIdx].visibility > 0.5) {
            
            const A = landmarks[aIdx];
            const B = landmarks[bIdx];
            const C = landmarks[cIdx];
            
            // Calculate angle
            const angle = calculateAngle(A, B, C);
            
            // Position for angle display
            const centerX = B.x * canvasElement.width;
            const centerY = B.y * canvasElement.height;
            
            // Draw angle arc
            const radius = 20;
            const angleAB = Math.atan2(A.y - B.y, A.x - B.x);
            const angleBC = Math.atan2(C.y - B.y, C.x - B.x);
            
            canvasCtx.strokeStyle = joint.color;
            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, radius, angleAB, angleBC);
            canvasCtx.stroke();
            
            // Draw angle value
            canvasCtx.fillStyle = '#FFFFFF';
            canvasCtx.font = 'bold 14px Arial';
            canvasCtx.textAlign = 'center';
            canvasCtx.textBaseline = 'middle';
            canvasCtx.fillText(`${Math.round(angle)}°`, centerX, centerY - radius - 10);
        }
    });
}

function calculateAllJointAngles(landmarks) {
    // Calculate left knee angle (hip-knee-ankle)
    if (landmarks[23] && landmarks[25] && landmarks[27]) {
        currentAngles.leftKnee = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
    }
    
    // Calculate right knee angle
    if (landmarks[24] && landmarks[26] && landmarks[28]) {
        currentAngles.rightKnee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
    }
    
    // Calculate left hip angle (shoulder-hip-knee)
    if (landmarks[11] && landmarks[23] && landmarks[25]) {
        currentAngles.leftHip = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
    }
    
    // Calculate right hip angle
    if (landmarks[12] && landmarks[24] && landmarks[26]) {
        currentAngles.rightHip = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
    }
    
    // Calculate left elbow angle (shoulder-elbow-wrist)
    if (landmarks[11] && landmarks[13] && landmarks[15]) {
        currentAngles.leftElbow = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
    }
    
    // Calculate right elbow angle
    if (landmarks[12] && landmarks[14] && landmarks[16]) {
        currentAngles.rightElbow = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
    }
    
    // Calculate back angle (shoulder-hip line vs vertical)
    if (landmarks[11] && landmarks[23]) {
        const shoulder = landmarks[11];
        const hip = landmarks[23];
        const vertical = { x: hip.x, y: hip.y - 0.1 };
        currentAngles.backAngle = calculateAngle(shoulder, hip, vertical);
    }
}

function updateAngleDisplays() {
    leftKneeAngleElement.textContent = `${Math.round(currentAngles.leftKnee)}°`;
    rightKneeAngleElement.textContent = `${Math.round(currentAngles.rightKnee)}°`;
    hipAngleElement.textContent = `${Math.round((currentAngles.leftHip + currentAngles.rightHip) / 2)}°`;
    
    // Calculate back straightness score
    const backScore = Math.max(0, 100 - Math.abs(currentAngles.backAngle - 180) * 2);
    backStraightnessElement.textContent = `${Math.round(backScore)}%`;
}

// ============================================
// MULTILINGUAL VOICE FEEDBACK
// ============================================

function speakMultilingualFeedback(messageKey, params = null) {
    if (!audioToggle.checked || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Get message in current language
    let message = feedbackMessages[currentLanguage][messageKey];
    if (typeof message === 'function') {
        message = message(params);
    }
    
    if (!message) return;
    
    const utterance = new SpeechSynthesisUtterance(message);
    
    // Set language based on selection
    const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'te': 'te-IN'
    };
    
    utterance.lang = langMap[currentLanguage] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find appropriate voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(currentLanguage) || 
        voice.lang.startsWith(langMap[currentLanguage])
    );
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

// ============================================
// ENHANCED EXERCISE ANALYSIS
// ============================================

function analyzeExercise(landmarks) {
    if (!isRunning) return;
    
    switch(currentExercise) {
        case 'squats':
            analyzeSquatsEnhanced();
            break;
        case 'bicep_curls':
            analyzeBicepCurlsEnhanced();
            break;
        case 'shoulder_press':
            analyzeShoulderPressEnhanced();
            break;
        case 'leg_raises':
            analyzeLegRaisesEnhanced();
            break;
    }
}

function analyzeSquatsEnhanced() {
    const config = exerciseConfig.squats;
    const avgKneeAngle = (currentAngles.leftKnee + currentAngles.rightKnee) / 2;
    const kneeDiff = Math.abs(currentAngles.leftKnee - currentAngles.rightKnee);
    const avgHipAngle = (currentAngles.leftHip + currentAngles.rightHip) / 2;
    
    let formScore = 100;
    let feedbackKey = null;
    
    // Check depth
    if (avgKneeAngle > 160) {
        feedbackKey = 'too_shallow';
        formScore -= 40;
    } else if (avgKneeAngle > 140) {
        feedbackKey = 'too_shallow';
        formScore -= 20;
    } else if (avgKneeAngle < 80) {
        feedbackKey = 'too_deep';
        formScore -= 30;
    } else if (avgKneeAngle >= 90 && avgKneeAngle <= 110) {
        feedbackKey = 'good_depth';
    }
    
    // Check knee alignment
    if (kneeDiff > 15) {
        feedbackKey = 'knee_alignment';
        formScore -= 25;
    }
    
    // Check back posture
    const backScore = Math.max(0, 100 - Math.abs(currentAngles.backAngle - 180) * 2);
    if (backScore < 70) {
        feedbackKey = 'back_straight';
        formScore -= 15;
    }
    
    // Update form score
    formScore = Math.max(0, Math.min(100, formScore));
    formScoreElement.textContent = `${Math.round(formScore)}%`;
    formScores.push(formScore);
    
    // Rep counting
    if (avgKneeAngle < 120 && !inRepPosition) {
        inRepPosition = true;
    } else if (avgKneeAngle > 150 && inRepPosition) {
        inRepPosition = false;
        repCount++;
        repCountElement.textContent = repCount;
        
        // Estimate calories
        caloriesBurned += (formScore > 70 ? 0.6 : 0.4);
        caloriesElement.textContent = Math.round(caloriesBurned * 10) / 10;
        
        // Multilingual feedback for completed rep
        speakMultilingualFeedback('rep_completed', repCount);
        return;
    }
    
    // Real-time feedback
    const now = Date.now();
    if (feedbackKey && now - lastFeedbackTime > 3000) {
        speakMultilingualFeedback(feedbackKey);
        lastFeedbackTime = now;
    } else if (!feedbackKey && formScore > 85 && now - lastFeedbackTime > 5000) {
        speakMultilingualFeedback('perfect_form');
        lastFeedbackTime = now;
    }
}

function analyzeBicepCurlsEnhanced() {
    const config = exerciseConfig.bicep_curls;
    const avgElbowAngle = (currentAngles.leftElbow + currentAngles.rightElbow) / 2;
    
    // Simple rep counting for bicep curls
    if (avgElbowAngle < 60 && !inRepPosition) {
        inRepPosition = true;
    } else if (avgElbowAngle > 150 && inRepPosition) {
        inRepPosition = false;
        repCount++;
        repCountElement.textContent = repCount;
        speakMultilingualFeedback('rep_completed', repCount);
    }
}

// ============================================
// EVENT LISTENERS & SESSION MANAGEMENT
// ============================================

function setupEventListeners() {
    // Start/Stop buttons
    startBtn.addEventListener('click', () => {
        startSession();
    });
    
    stopBtn.addEventListener('click', () => {
        stopSession();
    });
    
    // Calibrate button
    calibrateBtn.addEventListener('click', () => {
        calibrateSystem();
    });
    
    // Reset button
    resetBtn.addEventListener('click', () => {
        resetSession();
    });
    
    // Exercise selection buttons
    exerciseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            exerciseBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentExercise = btn.dataset.exercise;
            updateFeedback(`Switched to ${getExerciseName(currentExercise)}.`, 'info');
            resetReps();
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                if (isRunning) stopSession();
                else startSession();
                break;
            case 'r':
            case 'R':
                resetReps();
                break;
            case 'c':
            case 'C':
                calibrateSystem();
                break;
            case 'l':
            case 'L':
                // Cycle through languages
                cycleLanguage();
                break;
        }
    });
}

function startSession() {
    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    sessionStartTime = Date.now();
    
    // Start session timer
    sessionTimer = setInterval(updateSessionTimer, 1000);
    
    updateFeedback(feedbackMessages[currentLanguage].starting, 'started');
    speakMultilingualFeedback('starting');
    
    statusIndicator.textContent = '● Active';
    statusIndicator.style.color = '#4CAF50';
}

function stopSession() {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    // Stop session timer
    clearInterval(sessionTimer);
    
    updateFeedback(feedbackMessages[currentLanguage].stopped, 'stopped');
    speakMultilingualFeedback('stopped');
    
    statusIndicator.textContent = '● Paused';
    statusIndicator.style.color = '#FF9800';
    
    // Show summary
    showSessionSummary();
}

function calibrateSystem() {
    updateFeedback(feedbackMessages[currentLanguage].calibration, 'calibrating');
    speakMultilingualFeedback('calibration');
    
    // Visual calibration guide
    canvasCtx.save();
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasCtx.fillStyle = '#FFFFFF';
    canvasCtx.font = 'bold 24px Arial';
    canvasCtx.textAlign = 'center';
    canvasCtx.textBaseline = 'middle';
    
    const messages = [
        'Stand 2 meters from camera',
        'Ensure full body is visible',
        'Face the camera directly',
        'Keep good lighting',
        'Calibration complete in 3 seconds...'
    ];
    
    let currentMessage = 0;
    const showNextMessage = () => {
        if (currentMessage < messages.length) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.fillText(messages[currentMessage], canvasElement.width/2, canvasElement.height/2);
            currentMessage++;
            setTimeout(showNextMessage, 1000);
        } else {
            canvasCtx.restore();
            updateFeedback('Calibration complete!', 'success');
        }
    };
    
    showNextMessage();
}

function cycleLanguage() {
    const currentIndex = availableLanguages.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    currentLanguage = availableLanguages[nextIndex];
    
    // Update selector if exists
    const selector = document.getElementById('languageSelect');
    if (selector) selector.value = currentLanguage;
    
    localStorage.setItem('swasthyaai_language', currentLanguage);
    updateFeedback(`Language changed to ${languageNames[currentLanguage]}`, 'info');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateAngle(A, B, C) {
    const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
    const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
    const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
    
    const cosAngle = (AB * AB + BC * BC - AC * AC) / (2 * AB * BC);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    return angle * (180 / Math.PI);
}

function updateFeedback(message, type = "info") {
    if (feedbackText) {
        feedbackText.textContent = message;
        
        // Color code based on type
        const feedbackBox = document.getElementById('feedbackBox');
        if (feedbackBox) {
            feedbackBox.style.borderLeftColor = 
                type === 'success' ? '#4CAF50' :
                type === 'warning' ? '#FF9800' :
                type === 'error' ? '#F44336' :
                type === 'correction' ? '#2196F3' :
                type === 'perfect' ? '#9C27B0' :
                '#4a6fa5';
        }
    }
}

function updateSessionTimer() {
    if (!sessionStartTime) return;
    
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    if (sessionTimeElement) {
        sessionTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function getExerciseName(exercise) {
    const names = {
        'squats': 'Squats',
        'bicep_curls': 'Bicep Curls',
        'shoulder_press': 'Shoulder Press',
        'leg_raises': 'Leg Raises'
    };
    return names[exercise] || exercise;
}

function resetSession() {
    repCount = 0;
    formScores = [];
    caloriesBurned = 0;
    if (repCountElement) repCountElement.textContent = '0';
    if (formScoreElement) formScoreElement.textContent = '0%';
    if (caloriesElement) caloriesElement.textContent = '0';
    if (sessionTimeElement) sessionTimeElement.textContent = '0:00';
    
    updateFeedback('Session reset. Ready for new session.', 'info');
}

function resetReps() {
    repCount = 0;
    if (repCountElement) repCountElement.textContent = '0';
    updateFeedback('Rep count reset.', 'info');
}

function showSessionSummary() {
    if (formScores.length === 0) return;
    
    const avgScore = formScores.reduce((a, b) => a + b, 0) / formScores.length;
    const bestScore = Math.max(...formScores);
    
    // Show congratulatory message in current language
    let message = "Session Complete! ";
    if (avgScore > 85) {
        message += "Excellent form!";
    } else if (avgScore > 70) {
        message += "Good work!";
    } else {
        message += "Keep practicing!";
    }
    
    updateFeedback(message, "success");
    speakMultilingualFeedback('session_summary', [repCount, Math.round(avgScore)]);
}

// ============================================
// INITIALIZATION MESSAGE
// ============================================

console.log(`
╔══════════════════════════════════════════════╗
║         SWASTHYA AI VIRTUAL PHYSIOTHERAPIST  ║
║                Enhanced Version              ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Features Added:                             ║
║  • Complete skeleton visualization           ║
║  • Real-time joint angle calculation        ║
║  • Multilingual voice feedback (5 languages) ║
║  • Enhanced exercise analysis                ║
║                                              ║
║  Keyboard Shortcuts:                         ║
║  • SPACE = Start/Stop session               ║
║  • R = Reset rep count                       ║
║  • C = Calibrate camera                     ║
║  • L = Cycle through languages              ║
║                                              ║
║  Supported Languages:                        ║
║  • English, Hindi, Marathi, Tamil, Telugu   ║
║                                              ║
╚══════════════════════════════════════════════╝
`);
