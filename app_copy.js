class FashionistApp {
    constructor() {
        this.currentScreen = 'splash-screen';
        this.bottomNavRoutes = ['home-screen', 'feed-screen', 'saved-screen', 'profile-screen'];
        this.data = this.loadData();
        this.isDark = localStorage.getItem('theme') !== 'light';
        
        this.applyTheme();
        this.injectDynamicScreens();
        
        // Immediate init since script is at body end
        this.init();
    }

    loadData() {
        const defaultData = { followers: 0, coins: 0, hasFace: false, hasBody: false, profileName: "", profileUser: "", profileBio: "" };
        try {
            const stored = localStorage.getItem('fashionistData');
            const data = stored ? JSON.parse(stored) : defaultData;
            if (data.followers === 15450) {
                data.followers = 0;
                localStorage.setItem('fashionistData', JSON.stringify(data));
            }
            return data;
        } catch (e) {
            console.error("Critical: Corrupt fashionistData found. Resetting...", e);
            localStorage.removeItem('fashionistData');
            return defaultData;
        }
    }

    getLoggedInUser() {
        try {
            const stored = localStorage.getItem("loggedInUser");
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error("Critical: Corrupt loggedInUser found. Resetting...", e);
            localStorage.removeItem("loggedInUser");
            return null;
        }
    }

    saveData() {
        localStorage.setItem('fashionistData', JSON.stringify(this.data));
        this.updateProfileUI();
    }

    init() {
        console.log("FashionistApp: Initializing Startup Sequence...");
        
        // GLOBAL FAILSAFE: If something crashes, force hide splash after 5s
        window.onerror = (msg, url, line) => {
            console.error(`Startup Crash: ${msg} at ${line}`);
            this.forceHideSplash();
            return false;
        };

        try {
            this.updateGreeting();
            this.updateProfileUI();
            
            // Determine initial screen
            const user = this.getLoggedInUser();
            console.log("Initial State:", user ? "Logged In" : "Guest");

            // Branding delay: Allow splash to breathe for 1.2s then transition
            setTimeout(() => {
                if (this.currentScreen === 'splash-screen') {
                    if (user) {
                        this.navigate('home-screen');
                    } else {
                        this.transitionSplashToLogin();
                    }
                }
            }, 1200);

            // Hard Failsafe: 4s absolute limit
            setTimeout(() => this.forceHideSplash(), 4000);

        } catch (error) {
            console.error("Critical Error during init():", error);
            this.forceHideSplash();
        }
    }

    transitionSplashToLogin() {
        const splash = document.getElementById('splash-screen');
        const login = document.getElementById('login-screen');

        if (splash && login) {
            splash.classList.add('slide-out-left');
            login.classList.add('active'); 
            login.classList.remove('hidden');
            login.classList.add('slide-in-right');

            setTimeout(() => {
                this.navigate('login-screen');
                splash.classList.remove('slide-out-left');
                login.classList.remove('slide-in-right');
            }, 600);
        } else {
            this.navigate('login-screen');
        }
    }

    forceHideSplash() {
        const splash = document.getElementById('splash-screen');
        if (splash && this.currentScreen === 'splash-screen') {
            console.warn("Failsafe: Forcing splash removal.");
            const user = this.getLoggedInUser();
            this.navigate(user ? 'home-screen' : 'login-screen');
        }
    }

    applyTheme() {
        if(this.isDark) document.body.classList.remove('light-mode');
        else document.body.classList.add('light-mode');
        
        const toggle = document.getElementById('theme-toggle');
        if(toggle) toggle.checked = this.isDark;
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
        this.applyTheme();
    }

    updateGreeting() {
        let hour = new Date().getHours();
        let greeting = 'Good day,';
        if (hour < 12) greeting = 'Good morning,';
        else if (hour < 18) greeting = 'Good afternoon,';
        else greeting = 'Good evening,';
        const gEl = document.getElementById('dynamic-greeting');
        if(gEl) gEl.innerText = greeting;
    }

    updateProfileUI() {
        const followerEl = document.getElementById('follower-count');
        if(followerEl) {
            followerEl.innerText = this.data.followers >= 100000 
                ? (this.data.followers/1000000).toFixed(1) + 'M' 
                : this.data.followers.toLocaleString();
        }

        const showTick = this.data.followers >= 100000;
        const tick1 = document.getElementById('user-verified-tick');
        const tick2 = document.getElementById('profile-verified-tick');
        if(tick1) tick1.style.display = showTick ? 'inline-block' : 'none';
        if(tick2) tick2.style.display = showTick ? 'inline-block' : 'none';
        
        // Sync Profile Data (Fallback Sync for shared components)
        document.querySelectorAll('.sync-name').forEach(el => el.innerText = this.data.profileName || "Anonymous");
        document.querySelectorAll('.sync-user').forEach(el => el.innerText = this.data.profileUser ? "@" + this.data.profileUser : "@user");
        document.querySelectorAll('.sync-bio').forEach(el => el.innerText = this.data.profileBio || "No bio yet.");

        const user = this.getLoggedInUser();
        if (user) {
            // Home Screen Name
            const homeNameEl = document.getElementById("user-name");
            if (homeNameEl) homeNameEl.innerText = user.name || "Welcome Back";

            // Profile Screen Display Fields
            const displayNameEl = document.getElementById("display-name");
            const displayBioEl = document.getElementById("display-bio");
            const displayUserEl = document.getElementById("display-username");

            if (displayNameEl) displayNameEl.innerText = user.name || "Anonymous";
            if (displayBioEl) displayBioEl.innerText = user.bio || "No bio added yet.";
            if (displayUserEl) displayUserEl.innerText = user.username ? "@" + user.username : "@username";

            // Profile Photo Handling (No default image as requested)
            const profilePic = document.getElementById("profile-pic");
            const profilePicPlaceholder = document.getElementById("profile-pic-placeholder");
            
            if (profilePic) {
                if (user.profilePic) {
                    profilePic.src = user.profilePic;
                    profilePic.style.display = "block";
                    if (profilePicPlaceholder) profilePicPlaceholder.style.display = "none";
                } else {
                    profilePic.src = "";
                    profilePic.style.display = "none";
                    if (profilePicPlaceholder) profilePicPlaceholder.style.display = "block";
                }
            }
        }
    }

    navigate(screenId) {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(screenId);
        if(target) {
            target.classList.add('active');
            target.classList.remove('hidden');
            this.currentScreen = screenId;
            
            // Auto-load data for specific screens
            if (screenId === 'saved-screen') {
                this.loadSavedPosts();
            }
            if (screenId === 'profile-screen' || screenId === 'edit-profile-screen') {
                this.loadProfile();
            }
            if (screenId === 'settings-screen') {
                const keyInput = document.getElementById("settings-gemini-key");
                if (keyInput) {
                    keyInput.value = localStorage.getItem("customGeminiKey") || "";
                }
            }
        }

        const bottomNav = document.getElementById('bottom-nav');
        const fab = document.getElementById('social-fab');
        
        if (this.bottomNavRoutes.includes(screenId)) {
            if(bottomNav) bottomNav.classList.remove('hidden');
            if(fab) fab.classList.remove('hidden');
            this.updateBottomNavActiveState(screenId);
        } else {
            if(bottomNav) bottomNav.classList.add('hidden');
            if(fab) fab.classList.add('hidden');
        }
        
        window.scrollTo(0, 0); // Always snap back to top
    }

    updateBottomNavActiveState(screenId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if(item.getAttribute('onclick') && item.getAttribute('onclick').includes(screenId)) item.classList.add('active');
        });
    }

    // --- Overlays & Interactions (V4 Requirements) ---
    openSearchOverlay() {
        document.getElementById('search-overlay').classList.remove('hidden');
        document.getElementById('search-overlay').classList.add('slide-up-active');
    }
    closeSearchOverlay() {
        document.getElementById('search-overlay').classList.remove('slide-up-active');
        setTimeout(() => document.getElementById('search-overlay').classList.add('hidden'), 300);
    }
    
    openCommentSheet() {
        document.getElementById('comment-sheet').classList.remove('hidden');
        document.getElementById('comment-sheet').classList.add('slide-up-active');
    }
    closeCommentSheet() {
        document.getElementById('comment-sheet').classList.remove('slide-up-active');
        setTimeout(() => document.getElementById('comment-sheet').classList.add('hidden'), 300);
    }
    postComment() {
        const input = document.getElementById('new-cmt');
        if(!input.value) return;
        const list = document.getElementById('comment-list');
        
        // Remove 'No comments yet' message if present
        if (list.innerHTML.includes('No comments yet')) {
            list.innerHTML = '';
        }

        const div = document.createElement('div');
        div.className = "comment-item fade-in";
        div.innerHTML = `
            <div class="comment-avatar" style="display:flex; justify-content:center; align-items:center; background:#ffdf73; color:#120d0f;"><i class="fa-solid fa-user"></i></div>
            <div style="flex:1;">
                <p style="margin:0; font-size:0.9rem;"><strong>You</strong> Just now</p>
                <p style="margin:0; font-size:0.9rem;">${input.value}</p>
                <p class="text-muted" style="font-size:0.8rem; margin:4px 0 0 0; cursor:pointer;" onclick="this.parentNode.parentNode.style.display='none'">Delete</p>
            </div>
            <i class="fa-regular fa-heart" onclick="this.classList.toggle('fa-solid'); this.classList.toggle('heart-active');"></i>
        `;
        list.appendChild(div);
        input.value = '';
    }

    openCreatorSheet() {
        document.getElementById('creator-sheet').classList.remove('hidden');
        document.getElementById('creator-sheet').classList.add('slide-up-active');
    }
    closeCreatorSheet() {
        document.getElementById('creator-sheet').classList.remove('slide-up-active');
        setTimeout(() => document.getElementById('creator-sheet').classList.add('hidden'), 300);
    }

    triggerPayment() {
        if(confirm("Connecting to Payment Gateway... (Simulation). Purchase Fashionist Premium?")) {
            alert("✓ Success! You are now a Premium user.");
            this.navigate('home-screen');
        }
    }

    // --- Fix & Enhance Engine (V4 Setup) ---
    switchCETab(tab) {
        document.getElementById('tab-conceal').classList.remove('active');
        document.getElementById('tab-enhance').classList.remove('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        const subtitle = document.getElementById('ce-subtitle');
        const results = document.getElementById('ce-results');
        results.classList.add('hidden'); // Reset results on tab switch
        
        if(tab === 'conceal') {
            subtitle.innerText = "Select areas you want to naturally minimize or fix.";
        } else {
            subtitle.innerText = "Select features you love and want to draw ultimate attention to.";
        }
    }
    
    async generateCEResults() {
        const results = document.getElementById('ce-results');
        const isConceal = document.getElementById('tab-conceal').classList.contains('active');
        const title = document.getElementById('ce-result-title');
        const btn = document.querySelector('#insecurity-styling-screen .btn');
        
        // Collect selected pills and input
        const selectedPills = Array.from(document.querySelectorAll('#ce-pills .pill.selected')).map(el => el.innerText);
        const customInput = document.getElementById('ce-custom-input')?.value.trim();
        const features = selectedPills.join(', ') + (customInput ? (selectedPills.length ? ', ' : '') + customInput : '');
        
        if(!features) {
            alert("Please select or type at least one feature first.");
            return;
        }

        // Save preferences
        this.data.ceFeatures = features;
        this.data.ceMode = isConceal ? 'fix' : 'enhance';
        this.saveData();

        title.innerText = isConceal ? `How To Fix: ${features}` : `How To Enhance: ${features}`;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Consulting Gemini Stylist...';
        
        try {
            const modeText = isConceal ? 'fix/conceal' : 'enhance/accentuate';
            const prompt = `${AIStylist.getBaseSystemInstruction()}

---
# TASK: FIX & ENHANCE
User goals: Naturally ${modeText} the following feature(s): ${features}.
Never use the word "hide". Always use positive, empowering language.
Generate recommendations only for the active section requested.

REQUIRED JSON SCHEMA:
{
"fixEnhance": {
"userGoal": "${modeText} ${features}",
"clothingSuggestions": [""],
"hairSuggestions": [""],
"makeupSuggestions": [""],
"accessories": [""]
}
}

Minimum recommendations:
* Clothing Suggestions: 8
* Hair Suggestions: 6
* Makeup Suggestions: 6
* Accessories: 6`;
            
            const advice = await AIStylist.queryGemini(prompt);
            
            const contentContainer = document.getElementById('ce-result-content');
            if (contentContainer) {
                const parsedData = this.parseGeminiJSON(advice);
                contentContainer.innerHTML = this.renderJSONToHTML(parsedData, 'fixEnhance');
            }
            
            // Set up save button
            const saveBtn = document.getElementById('save-ce-btn');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    this.savePost({
                        image: "https://images.unsplash.com/photo-1595777457583-95e059f581ce?q=80&w=400&fit=crop",
                        category: "other",
                        caption: `${isConceal ? 'Fix' : 'Enhance'} Guide: ${features}`
                    });
                };
            }
            
            btn.innerHTML = 'Generate Styling Guide';
            results.classList.remove('hidden');
            window.scrollTo(0, document.body.scrollHeight);
        } catch (error) {
            console.error("Fix & Enhance advice error:", error);
            alert("Could not generate recommendations. Please try again.");
            btn.innerHTML = 'Generate Styling Guide';
        }
    }

    // Auth Validations
    togglePassword(id) {
        const input = document.getElementById(id);
        if(input) input.type = input.type === 'password' ? 'text' : 'password';
    }

    loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;

            const userData = {
                name: user.displayName,
                email: user.email,
                profilePic: user.photoURL
            };

            // Save user to Realtime Database
            firebase.database().ref("users/" + user.uid).set(userData);

            // Save user session
            localStorage.setItem("loggedInUser", JSON.stringify(userData));

            this.navigate('home-screen');
            this.updateProfileUI();
        })
        .catch((error) => {
            console.error(error);
            alert(error.message);
        });
    }

    logout() {
        localStorage.removeItem("loggedInUser");
        firebase.auth().signOut();
        this.navigate('login-screen');
    }

    loginUser() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!email || !password) {
            alert("Enter email & password");
            return;
        }

        console.log("Attempting login for:", email);

        firebase.database().ref("users").once("value", (snapshot) => {
            console.log("Database response received");
            
            let found = false;

            snapshot.forEach((child) => {
                const user = child.val();
                if (user.email == email && user.password == password) {
                    found = true;
                }
            });

            if (found) {
                console.log("Login successful");
                localStorage.setItem("loggedInUser", JSON.stringify({ name: email.split('@')[0], email: email }));
                this.navigate('home-screen');
                this.updateProfileUI();
            } else {
                console.log("Login failed: Invalid credentials");
                alert("Wrong email or password");
            }

        }, (error) => {
            console.error("Firebase Error:", error);
            alert("Error connecting to database");
        });
    }

    attemptLogin() {
        this.loginUser();
    }

    attemptSignup() {

    const name = document.getElementById('name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms').checked;

    // VALIDATIONS
    if (!name) {
        alert("Please provide your full name.");
        return;
    }

    if (!email || !password) {
        alert("Enter email & password.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (!terms) {
        alert("You must agree to the Terms & Privacy Policy.");
        return;
    }

    const id = Date.now();

    // SAVE TO FIREBASE
    firebase.database().ref("users/" + id).set({
        name: name,
        username: username,
        email: email,
        password: password
    })
    .then(() => {
        console.log("User saved successfully");

        // CONTINUE YOUR EXISTING FLOW
        this.authenticate('Email Registration');
    })
    .catch((error) => {
        console.error("Firebase error:", error);
        alert("Error saving data");
    });
}


// AUTH SYSTEM (UNCHANGED)
authenticate(provider) {

    if (provider === 'Logout') {
        this.logout();
        return;
    }

    const overlay = document.getElementById('auth-spinner');
    const text = document.getElementById('auth-text');

    overlay.classList.remove('hidden');
    text.innerText = `Connecting via ${provider}...`;

    setTimeout(() => {
        text.innerText = "Verifying Credentials...";
        setTimeout(() => {
            overlay.classList.add('hidden');
            this.navigate('home-screen');
            this.claimDailyReward();
        }, 1000);
    }, 1500);
}


// REWARD SYSTEM (UNCHANGED)
claimDailyReward() {
    setTimeout(() => {
        alert("Daily Login Reward! You earned +50 Fashionist Coins 🪙");
        this.data.coins += 50;
        this.saveData();
    }, 1500);
}
    // Event routing
    navigateToEvent() {
        this.navigate('event-styling-screen');
    }



    // Body Analysis routing
    generateBodyShapeResult() {
        document.getElementById('body-measurements-form').classList.add('hidden');
        document.getElementById('body-loading').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('body-loading').classList.add('hidden');
            document.getElementById('body-results').classList.remove('hidden');
            this.data.hasBody = true;
            this.saveData();
        }, 2000);
    }

    // Process face analysis upload
    async processFaceAnalysis(file) {
        if (!file) return;
        // Hide input, show loading
        const inputContainer = document.getElementById('face-input-container');
        const loading = document.getElementById('face-loading');
        const previewContainer = document.getElementById('face-preview-container');
        const resultsContainer = document.getElementById('face-results');
        inputContainer?.classList.add('hidden');
        loading?.classList.remove('hidden');
        document.getElementById('face-loading-status').innerText = 'Reading image...';
        // Load file into Image
        const img = new Image();
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        img.src = dataUrl;
        await new Promise(r => img.onload = r);
        // Draw preview
        const canvas = document.getElementById('face-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        previewContainer?.classList.remove('hidden');
        // Run MediaPipe FaceMesh
        document.getElementById('face-loading-status').innerText = 'Running MediaPipe FaceMesh...';
        const landmarks = await AIStylist.detectFaceLandmarks(img);
        const { shape, ratios } = AIStylist.calculateFaceShape(landmarks);
        const skinHex = AIStylist.getSkinColorHex(img, landmarks);
        // Update UI with analysis results
        document.getElementById('face-shape-title').innerText = `Detected ${shape} Face`;
        document.getElementById('face-shape-subtitle').innerText = `Length/Width: ${ratios.lengthToWidth}, Jaw/Cheek: ${ratios.jawToCheek}`;
            // Query Gemini for styling advice
            try {
                const adviceContainer = document.getElementById('face-stylist-advice');
                adviceContainer.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating advice...';
                const advice = await AIStylist.queryFaceStylist(shape, ratios, skinHex);
                const parsed = this.parseGeminiJSON(advice);
                adviceContainer.innerHTML = this.renderJSONToHTML(parsed, 'faceAnalysis');
            } catch (err) {
                console.error('Face styling advice error:', err);
                document.getElementById('face-stylist-advice').innerHTML = "<p class='text-muted' style='padding:16px;'><i class='fa-solid fa-triangle-exclamation'></i> Unable to generate styling advice. Please try again.</p>";
            }
        // Show results
        loading?.classList.add('hidden');
        resultsContainer?.classList.remove('hidden');
    }

    // Process body analysis upload
    async processBodyAnalysis(file) {
        if (!file) return;
        const inputContainer = document.getElementById('body-photo-container');
        const loading = document.getElementById('body-loading');
        const canvasContainer = document.getElementById('body-canvas-container');
        const resultsContainer = document.getElementById('body-results');
        inputContainer?.classList.add('hidden');
        loading?.classList.remove('hidden');
        document.getElementById('body-loading-status').innerText = 'Reading image...';
        // Load file into Image
        const img = new Image();
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        img.src = dataUrl;
        await new Promise(r => img.onload = r);
        // Draw preview
        const canvas = document.getElementById('body-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvasContainer?.classList.remove('hidden');
        // Run MediaPipe Pose
        document.getElementById('body-loading-status').innerText = 'Running MediaPipe Pose...';
        if (!window.AIStylist) {
            console.error('AIStylist is not loaded. Ensure ai-stylist.js script is included before app.js.');
            return;
        }
        const landmarks = await AIStylist.detectPoseLandmarks(img);
        const { shape, ratios } = AIStylist.calculateBodyShape(landmarks);
        // Update UI with analysis results
        document.getElementById('body-shape-title').innerText = `Detected ${shape} Silhouette`;
        document.getElementById('body-shape-subtitle').innerText = `Shoulder/Hip Ratio: ${ratios.shoulderToHip}`;
            try {
                const bodyAdviceContainer = document.getElementById('body-stylist-advice');
                if (bodyAdviceContainer) bodyAdviceContainer.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating advice...';
                const advice = await AIStylist.queryBodyStylist(shape, ratios);
                const parsed = this.parseGeminiJSON(advice);
                if (bodyAdviceContainer) bodyAdviceContainer.innerHTML = this.renderJSONToHTML(parsed, 'bodyAnalysis');
            } catch (err) {
                console.error('Body styling advice error:', err);
                const bodyAdviceContainer = document.getElementById('body-stylist-advice');
                if (bodyAdviceContainer) bodyAdviceContainer.innerHTML = "<p class='text-muted' style='padding:16px;'><i class='fa-solid fa-triangle-exclamation'></i> Unable to generate styling advice. Please try again.</p>";
            }
        // Show results
        loading?.classList.add('hidden');
        resultsContainer?.classList.remove('hidden');
    }

    loadProfile() {
        const user = this.getLoggedInUser();
        if (!user) return;

        const nameField = document.getElementById("profile-name");
        const userField = document.getElementById("profile-username");
        const bioField = document.getElementById("profile-bio");
        const emailField = document.getElementById("profile-email");

        if (nameField) nameField.value = user.name || "";
        if (userField) userField.value = user.username || "";
        if (bioField) bioField.value = user.bio || "";
        if (emailField) emailField.value = user.email || "";
    }

    updateProfile() {
        const user = this.getLoggedInUser();
        if (!user) return;

        const name = document.getElementById("profile-name")?.value;
        const username = document.getElementById("profile-username")?.value;
        const bio = document.getElementById("profile-bio")?.value;

        const updatedData = {
            name: name || "",
            username: username || "",
            bio: bio || "",
            email: user.email,
            profilePic: user.profilePic || ""
        };

        const userId = user.email.replace(/\./g, '_');

        // Sync with internal app data state
        this.data.profileName = updatedData.name;
        this.data.profileUser = updatedData.username;
        this.data.profileBio = updatedData.bio;

        // Save to Firebase
        firebase.database().ref("users/" + userId).update(updatedData)
        .then(() => {
            // Update localStorage
            localStorage.setItem("loggedInUser", JSON.stringify(updatedData));
            this.saveData(); // Syncs fashionistData and triggers UI update
            
            alert("Profile updated successfully");
            this.navigate('profile-screen');
        })
        .catch((error) => {
            console.error("Update Error:", error);
            alert("Failed to update profile in database.");
        });
    }

    // Dynamic Injection for remaining bulk screens
    injectDynamicScreens() {
        const appContainer = document.getElementById('app-container');
        if (!appContainer) {
            console.error("Critical: #app-container not found in DOM.");
            return;
        }
        
        // --- PHASE 3: Social & Inbox ---
        const feedScreen = document.createElement('div');
        feedScreen.id = 'feed-screen'; feedScreen.className = 'screen hidden';
        feedScreen.innerHTML = `
            <div class="top-bar mt-4"><h2 class="title" style="font-size: 1.5rem;">Explore Pixies</h2><div class="btn-icon" onclick="app.openSearchOverlay()"><i class="fa-solid fa-magnifying-glass"></i></div></div>
            <p class="text-muted">Trending Fashion Reels (Pixies) from Creators.</p>
            <div class="card" style="padding:0; height:60vh; position:relative;">
                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&fit=crop" style="width:100%;height:100%;object-fit:cover; filter:brightness(0.8);" />
                <div style="position:absolute; bottom:20px; left:20px; right:60px;">
                    <h3 style="color:#fff; text-shadow:0 2px 4px rgba(0,0,0,0.5);">@ZaraTrending <i class="fa-solid fa-circle-check" style="color:#1DA1F2;"></i></h3>
                    <p style="color:#fff;">OOTD! 🤍 Fall lookbook. #fashion</p>
                </div>
                <!-- Interactive Action Buttons -->
                <div style="position:absolute; bottom:40px; right:16px; display:flex; flex-direction:column; gap:24px; color:#fff; font-size:1.8rem; text-shadow:0 2px 4px rgba(0,0,0,0.5); align-items:center;">
                    <div><i class="fa-regular fa-heart" onclick="this.classList.toggle('fa-solid'); this.classList.toggle('heart-active');"></i><br><span style="font-size:0.8rem; text-align:center; display:block;">12k</span></div>
                    <div><i class="fa-solid fa-comment" onclick="app.openCommentSheet()"></i><br><span style="font-size:0.8rem; text-align:center; display:block;">43</span></div>
                    <div><i class="fa-regular fa-bookmark" onclick="app.savePost({image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&fit=crop', category:'outfit'})"></i><br><span style="font-size:0.8rem; text-align:center; display:block;">Save</span></div>
                    <div><i class="fa-solid fa-share" onclick="alert('Mock Share Options opened (Instagram, WhatsApp)')"></i><br><span style="font-size:0.8rem; text-align:center; display:block;">Share</span></div>
                </div>
            </div>`;
        appContainer.appendChild(feedScreen);
        
        // --- Inbox ---
        const inboxScreen = document.createElement('div');
        inboxScreen.id = 'inbox-screen'; inboxScreen.className = 'screen hidden';
        inboxScreen.innerHTML = `
            <div class="top-bar mt-4"><div class="btn-icon" onclick="app.navigate('home-screen')"><i class="fa-solid fa-arrow-left"></i></div><h2 class="title" style="font-size: 1.5rem;">Direct Messaging</h2><div style="width:44px;"></div></div>
            <div style="display:flex; align-items:center; gap:16px; padding:16px; border-bottom:1px solid var(--border-light); cursor:pointer;" onclick="alert('Mock chat thread with StylistSarah opened.')">
                <div class="avatar" style="width:40px; height:40px;"><img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop"/></div>
                <div><h4 style="margin:0;">StylistSarah</h4><p style="margin:0; font-size:0.85rem; color:var(--text-muted);">Typing...</p></div>
                <div style="width:10px; height:10px; border-radius:50%; background:var(--accent-success); margin-left:auto;"></div>
            </div>`;
        appContainer.appendChild(inboxScreen);

        // --- Real AI Face/Body Integration ---
        const faceScreen = document.createElement('div');
        faceScreen.id = 'face-analysis-screen'; faceScreen.className = 'screen hidden';
        faceScreen.innerHTML = `
            <div class="top-bar mt-4"><div class="btn-icon" onclick="app.navigate('home-screen')"><i class="fa-solid fa-arrow-left"></i></div><h2 class="title" style="font-size: 1.2rem;">Detailed Face AI</h2><div style="width:44px;"></div></div>
            
            <div id="face-input-container" class="card" onclick="document.getElementById('face-file-input').click()" style="text-align:center; padding: 40px 20px; cursor: pointer; border: 2px dashed rgba(183,110,121,0.5); position:relative;">
                <input type="file" id="face-file-input" accept="image/*" style="display:none;" onchange="app.processFaceAnalysis(this.files[0])">
                <i class="fa-solid fa-camera mb-4" style="font-size:3rem; color:var(--text-muted);"></i>
                <h4>Upload Portrait Photo</h4>
                <p class="text-muted mt-2" style="font-size:0.8rem;">Upload a clear front-facing portrait to analyze jawline, cheekbones, and face ratios.</p>
            </div>

            <div id="face-loading" class="hidden mt-8 text-center">
                <i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 2.5rem;"></i>
                <p class="mt-4 text-muted" id="face-loading-status">Loading MediaPipe Models...</p>
            </div>

            <div id="face-preview-container" class="hidden mt-4" style="text-align:center; position:relative;">
                <canvas id="face-canvas" style="width:100%; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15); max-height: 350px; object-fit: contain;"></canvas>
            </div>

            <div id="face-results" class="hidden mt-4">
                <div class="card premium-card" style="box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);">
                    <h3 id="face-shape-title" style="margin-bottom:8px;">Analyzing...</h3>
                    <p id="face-shape-subtitle" style="font-size: 0.9rem; margin-bottom:0;" class="text-inverse"></p>
                </div>
                
                <h4 class="mt-4 mb-2">Styling Recommendations</h4>
                <div class="card" id="face-stylist-advice" style="font-size: 0.9rem; line-height: 1.6; white-space: pre-line;">
                </div>
                
                <button class="btn btn-secondary mt-4" style="background-color: var(--bg-tertiary);" id="save-face-btn">Save Result</button>
            </div>`;
        appContainer.appendChild(faceScreen);
        
        const bodyScreen = document.createElement('div');
        bodyScreen.id = 'body-analysis-screen'; bodyScreen.className = 'screen hidden';
        bodyScreen.innerHTML = `
            <div class="top-bar mt-4"><div class="btn-icon" onclick="app.navigate('home-screen')"><i class="fa-solid fa-arrow-left"></i></div><h2 class="title" style="font-size: 1.2rem;">Detailed Body AI</h2><div style="width:44px;"></div></div>
            
            <div class="ce-tabs mb-4" style="display:flex; justify-content:center; gap:8px;">
                <div class="ce-tab active" id="body-tab-form" onclick="app.switchBodyTab('form')">Manual Entry</div>
                <div class="ce-tab" id="body-tab-photo" onclick="app.switchBodyTab('photo')">Photo Analysis (AI)</div>
            </div>

            <!-- Manual Entry Form -->
            <div id="body-form-container">
                <div id="body-measurements-form">
                    <h3 class="mb-2">Enter Your Measurements</h3>
                    <p class="text-muted mb-4" style="font-size: 0.9rem;">Fill in your measurements so Fashionist can analyze your body shape and suggest optimal clothing options.</p>
                    
                    <div class="input-container"><i class="fa-solid fa-ruler-vertical text-muted" style="position:absolute; left:16px; top:18px;"></i><input type="number" id="body-bust" class="input-field" style="padding-left:45px;" placeholder="Bust / Chest in cm"></div>
                    <div class="input-container"><i class="fa-solid fa-ruler-horizontal text-muted" style="position:absolute; left:16px; top:18px;"></i><input type="number" id="body-waist" class="input-field" style="padding-left:45px;" placeholder="Waist in cm"></div>
                    <div class="input-container"><i class="fa-solid fa-tape text-muted" style="position:absolute; left:16px; top:18px;"></i><input type="number" id="body-hip" class="input-field" style="padding-left:45px;" placeholder="Hip in cm"></div>
                    <div class="input-container"><i class="fa-solid fa-up-down text-muted" style="position:absolute; left:16px; top:18px;"></i><input type="number" id="body-height" class="input-field" style="padding-left:45px;" placeholder="Height in cm (e.g. 165)"></div>
                    <div class="input-container"><i class="fa-solid fa-weight-scale text-muted" style="position:absolute; left:16px; top:18px;"></i><input type="number" id="body-weight" class="input-field" style="padding-left:45px;" placeholder="Weight in kg"></div>
                    <div class="input-container"><i class="fa-solid fa-scissors text-muted" style="position:absolute; left:16px; top:18px;"></i><input type="text" id="body-hair" class="input-field" style="padding-left:45px;" placeholder="Hair Length (e.g. Shoulder length)"></div>
                    
                    <button class="btn mt-4" onclick="app.generateBodyShapeResult(true)">Analyze My Shape</button>
                </div>
            </div>

            <!-- Photo Mode Input -->
            <div id="body-photo-container" class="hidden">
                <div id="body-upload-card" class="card" onclick="document.getElementById('body-file-input').click()" style="text-align:center; padding: 40px 20px; cursor: pointer; border: 2px dashed rgba(183,110,121,0.5); position:relative;">
                    <input type="file" id="body-file-input" accept="image/*" style="display:none;" onchange="app.processBodyAnalysis(this.files[0])">
                    <i class="fa-solid fa-camera mb-4" style="font-size:3rem; color:var(--text-muted);"></i>
                    <h4>Upload Full-Body Photo</h4>
                    <p class="text-muted mt-2" style="font-size:0.8rem;">Upload a clear full-body photo standing straight. MediaPipe Pose will detect your coordinates.</p>
                </div>
                
                <div id="body-canvas-container" class="hidden mt-4" style="text-align:center;">
                    <canvas id="body-canvas" style="width:100%; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15); max-height: 350px; object-fit: contain;"></canvas>
                </div>
            </div>

            <div id="body-loading" class="hidden mt-8 text-center">
                <i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 2.5rem;"></i>
                <p id="body-loading-status" class="mt-4 text-muted">Calculating proportions...</p>
            </div>

            <div id="body-results" class="hidden mt-4">
                <div class="card premium-card" style="box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);">
                    <h3 id="body-shape-title" style="margin-bottom:8px;">Analyzing...</h3>
                    <p id="body-shape-subtitle" style="font-size: 0.9rem; margin-bottom:0;" class="text-inverse"></p>
                </div>
                
                <h4 class="mt-4 mb-2">Styling Recommendations</h4>
                <div class="card" id="body-stylist-advice" style="font-size: 0.9rem; line-height: 1.6; white-space: pre-line;">
                </div>
                <button class="btn btn-secondary mt-4" style="background-color: var(--bg-tertiary);" id="save-body-btn">Save Result</button>
            </div>
        `;
        appContainer.appendChild(bodyScreen);
        
        const eventScreen = document.createElement('div');
        eventScreen.id = 'event-styling-screen'; eventScreen.className = 'screen hidden';
        eventScreen.innerHTML = `
            <div class="top-bar mt-4">
                <div class="btn-icon" onclick="app.navigate('home-screen')"><i class="fa-solid fa-arrow-left"></i></div>
                <h2 class="title" style="font-size: 1.2rem;">Event Styling</h2>
                <div style="width:44px;"></div>
            </div>
            
            <p class="text-muted mb-6 text-center" style="font-size: 0.95rem; margin-bottom: 24px;">Select your event styling approach:</p>
            
            <div class="large-feature-card mt-4" onclick="app.navigate('event-have-screen')">
                <i class="fa-solid fa-camera"></i>
                <div>
                    <h3>I Have My Outfit</h3>
                    <p>Post your outfit. We'll design hair, makeup, & styling based on it.</p>
                </div>
            </div>

            <div class="large-feature-card mt-4" onclick="app.navigate('event-need-screen')">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <div>
                    <h3>I Need An Outfit</h3>
                    <p>Curate a complete outfit, shoes, bag, & makeup for your event.</p>
                </div>
            </div>
        `;
        appContainer.appendChild(eventScreen);
        
        const eventHaveScreen = document.createElement('div');
        eventHaveScreen.id = 'event-have-screen'; eventHaveScreen.className = 'screen hidden';
        eventHaveScreen.innerHTML = `
            <div class="top-bar mt-4">
                <div class="btn-icon" onclick="app.navigate('event-styling-screen')"><i class="fa-solid fa-arrow-left"></i></div>
                <h2 class="title" style="font-size: 1.2rem;">Style My Outfit</h2>
                <div style="width:44px;"></div>
            </div>
            
            <p class="text-muted mb-4">Type the event name and post your outfit to design hair, makeup & styling.</p>
            <div class="input-container mb-4">
                <input type="text" id="event-name-have" class="input-field" placeholder="What event are you attending? (e.g. Birthday Party)">
            </div>
            
            <div id="event-outfit-upload" class="card" onclick="document.getElementById('event-outfit-file').click()" style="text-align:center; padding: 40px 20px; cursor: pointer; border: 2px dashed rgba(183,110,121,0.5); position:relative;">
                <input type="file" id="event-outfit-file" accept="image/*" style="display:none;" onchange="app.handleEventOutfitUpload(this.files[0])">
                <i class="fa-solid fa-camera mb-4" style="font-size:3rem; color:var(--text-muted);"></i>
                <h4>Post Your Outfit Photo</h4>
                <p class="text-muted mt-2" style="font-size:0.8rem;">Upload a photo of your outfit. We'll design makeup & hairstyle for it!</p>
            </div>
            <div id="event-outfit-preview-container" class="hidden mt-4" style="text-align:center;">
                <img id="event-outfit-preview" style="width:100%; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15); max-height:250px; object-fit:contain;" />
            </div>
            <button class="btn mt-4" style="background: linear-gradient(135deg, #d4af37, #b76e79); color: #fff;" onclick="app.generateEventStylistAdvice(true)">Analyze & Style Outfit</button>
            
            <div id="event-have-loading" class="hidden mt-8 text-center">
                <i class="fa-solid fa-spinner fa-spin text-rose" style="font-size: 2.5rem;"></i>
                <p class="mt-4 text-muted" id="event-have-loading-status">Curating your style...</p>
            </div>

            <div id="event-have-results" class="hidden mt-8">
                <div class="card" style="background-color: #fcf8f2; border: 1px solid #e0bfb8; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <h3 style="color: #120d0f; margin-bottom: 12px;" id="event-have-result-title">Your Curated Look</h3>
                    <div id="event-have-result-advice" style="color: #302126; font-size: 0.9rem; line-height: 1.6; white-space: pre-line;">
                    </div>
                </div>
                <button class="btn btn-secondary mt-4" style="background-color: var(--bg-tertiary);" id="save-event-have-btn">Save Outfit</button>
            </div>
        `;
        appContainer.appendChild(eventHaveScreen);

        const eventNeedScreen = document.createElement('div');
        eventNeedScreen.id = 'event-need-screen'; eventNeedScreen.className = 'screen hidden';
        eventNeedScreen.innerHTML = `
            <div class="top-bar mt-4">
                <div class="btn-icon" onclick="app.navigate('event-styling-screen')"><i class="fa-solid fa-arrow-left"></i></div>
                <h2 class="title" style="font-size: 1.2rem;">Plan My Outfit</h2>
                <div style="width:44px;"></div>
            </div>
            
            <p class="text-muted mb-4">Type the event details. We'll curate a complete look matching your profile.</p>
            <div class="input-container mb-4">
                <input type="text" id="event-name-need" class="input-field" placeholder="What event are you attending? (e.g. Beach Wedding)">
            </div>
            <button class="btn mt-4" style="background: linear-gradient(135deg, #d4af37, #b76e79); color: #fff;" onclick="app.generateEventStylistAdvice(false)">Curate Complete Look</button>
            
            <div id="event-need-loading" class="hidden mt-8 text-center">
                <i class="fa-solid fa-spinner fa-spin text-rose" style="font-size: 2.5rem;"></i>
                <p class="mt-4 text-muted" id="event-need-loading-status">Curating your style...</p>
            </div>

            <div id="event-need-results" class="hidden mt-8">
                <div class="card" style="background-color: #fcf8f2; border: 1px solid #e0bfb8; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <h3 style="color: #120d0f; margin-bottom: 12px;" id="event-need-result-title">Your Curated Look</h3>
                    <div id="event-need-result-advice" style="color: #302126; font-size: 0.9rem; line-height: 1.6; white-space: pre-line;">
                    </div>
                </div>
                <button class="btn btn-secondary mt-4" style="background-color: var(--bg-tertiary);" id="save-event-need-btn">Save Outfit</button>
            </div>
        `;
        appContainer.appendChild(eventNeedScreen);
        
        const settingsScreen = document.createElement('div');
        settingsScreen.id = 'settings-screen'; settingsScreen.className = 'screen hidden';
        settingsScreen.innerHTML = `
            <div class="top-bar mt-4"><div class="btn-icon" onclick="app.navigate('profile-screen')"><i class="fa-solid fa-arrow-left"></i></div><h2 class="title" style="font-size: 1.2rem;">Settings</h2><div style="width:44px;"></div></div>
            
            <div class="card" style="padding:0;">
                <h4 class="text-muted" style="padding:16px 16px 8px 16px; margin:0; font-size:0.85rem; text-transform:uppercase;">Account</h4>
                <div class="setting-item" style="padding: 16px; cursor:pointer;" onclick="app.navigate('edit-profile-screen')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-user" style="font-size:1.2rem; min-width:24px;"></i><span>Edit Profile</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
                <div class="setting-item" style="padding: 16px; cursor:pointer;" onclick="alert('Mock Security Options')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-shield-halved" style="font-size:1.2rem; min-width:24px;"></i><span>Security</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
                <div class="setting-item" style="padding: 16px; cursor:pointer;" onclick="alert('Mock Privacy Mode')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-lock" style="font-size:1.2rem; min-width:24px;"></i><span>Privacy</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
                <div class="setting-item" style="padding: 16px; border-bottom:none; cursor:pointer;" onclick="alert('Mock Saved Prefs')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-bookmark" style="font-size:1.2rem; min-width:24px;"></i><span>Saved Preferences</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
            </div>

            <div class="card" style="padding:0;">
                <h4 class="text-muted" style="padding:16px 16px 8px 16px; margin:0; font-size:0.85rem; text-transform:uppercase;">AI Keys Configuration</h4>
                <div class="setting-item" style="padding: 16px; flex-direction:column; align-items:stretch;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;"><i class="fa-solid fa-key" style="font-size:1.1rem; min-width:24px;"></i><span>Gemini API Key</span></div>
                    <input type="password" id="settings-gemini-key" class="input-field" placeholder="Enter custom Gemini API Key..." onchange="app.saveCustomApiKey(this.value)" style="margin-top:4px; font-size:0.85rem;">
                </div>
            </div>

            <div class="card" style="padding:0;">
                <h4 class="text-muted" style="padding:16px 16px 8px 16px; margin:0; font-size:0.85rem; text-transform:uppercase;">App Settings</h4>
                <div class="setting-item" style="padding: 16px;">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-moon" style="font-size:1.2rem; min-width:24px;"></i><span>Appearance (Dark Mode)</span></div>
                    <label class="switch"><input type="checkbox" id="theme-toggle" onchange="app.toggleTheme()"><span class="slider"></span></label>
                </div>
                <div class="setting-item" style="padding: 16px; cursor:pointer;" onclick="alert('Mock Notification Config')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-bell" style="font-size:1.2rem; min-width:24px;"></i><span>Notifications</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
                <div class="setting-item" style="padding: 16px; border-bottom:none; cursor:pointer;" onclick="alert('Mock Language Selected: English')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-globe" style="font-size:1.2rem; min-width:24px;"></i><span>Language</span></div>
                    <span class="text-muted">English</span>
                </div>
            </div>

            <div class="card" style="padding:0;">
                <h4 class="text-muted" style="padding:16px 16px 8px 16px; margin:0; font-size:0.85rem; text-transform:uppercase;">More</h4>
                <div class="setting-item" style="padding: 16px; cursor:pointer;" onclick="alert('Help center launching...')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-circle-question" style="font-size:1.2rem; min-width:24px;"></i><span>Help & Support</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
                <div class="setting-item" style="padding: 16px; border-bottom:none; cursor:pointer;" onclick="alert('Fashionist Ultimate V4.5')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-circle-info" style="font-size:1.2rem; min-width:24px;"></i><span>About App</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
            </div>

            <button class="btn btn-secondary mt-4 mb-8" style="background-color: var(--bg-primary); border-color:var(--accent-error); color:var(--accent-error);" onclick="app.authenticate('Logout')"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out</button>
        `;
        appContainer.appendChild(settingsScreen);
    }

    // --- SAVED / BOOKMARK SYSTEM ---

    savePost(postData) {
        const user = this.getLoggedInUser();
        if (!user) {
            alert("Please log in to save posts.");
            return;
        }

        const emailKey = user.email.replace(/\./g, '_');
        const savePath = "saved/" + emailKey;
        
        // Prevent Duplicates: Check if already exists
        firebase.database().ref(savePath).once('value', snapshot => {
            let exists = false;
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    if (child.val().image === postData.image) {
                        exists = true;
                    }
                });
            }

            if (exists) {
                alert("This post is already in your Saved collection! ✨");
                return;
            }

            // Proceed with saving
            const id = Date.now();
            firebase.database().ref(savePath + "/" + id).update({
                image: postData.image || "",
                category: postData.category || "other",
                caption: postData.caption || "",
                timestamp: id
            })
            .then(() => {
                alert("✓ Post Saved to your Bookmarks!");
            })
            .catch((error) => {
                console.error("Save Error:", error);
                alert("Failed to save post.");
            });
        });
    }

    loadSavedPosts() {
        const user = this.getLoggedInUser();
        if (!user) return;

        const container = document.getElementById("saved-container");
        if (!container) return;

        container.innerHTML = `<div style="grid-column: span 3; text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 2rem;"></i><p class="mt-4 text-muted">Loading your collection...</p></div>`;

        const emailKey = user.email.replace(/\./g, '_');
        firebase.database().ref("saved/" + emailKey).once("value", snapshot => {
            container.innerHTML = "";

            if (!snapshot.exists()) {
                container.innerHTML = `<div style="grid-column: span 3; text-align:center; padding: 60px 20px;">
                    <i class="fa-regular fa-bookmark text-muted mb-4" style="font-size: 3rem;"></i>
                    <h3>No saved posts yet</h3>
                    <p class="text-muted">Start exploring and save your favorite styles here.</p>
                    <button class="btn mt-4" style="width:auto; padding: 10px 24px;" onclick="app.navigate('feed-screen')">Explore Pixies</button>
                </div>`;
                return;
            }

            snapshot.forEach(child => {
                const post = child.val();
                
                // Filter by category
                if (this.currentSavedCategory && this.currentSavedCategory !== 'all') {
                    if (post.category !== this.currentSavedCategory) return;
                }

                const div = document.createElement("div");
                div.className = "saved-item fade-in";
                div.innerHTML = `
                    <div style="position:relative; width:100%; aspect-ratio: 1/1; overflow:hidden; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <img src="${post.image}" style="width:100%; height:100%; object-fit:cover;">
                        <span style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:#fff; padding:2px 8px; border-radius:6px; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px;">${post.category}</span>
                    </div>
                `;
                container.appendChild(div);
            });
        });
    }

    showSavedCategory(category, el) {
        this.currentSavedCategory = category;
        
        // UI Tab Switch
        if (el) {
            const tabs = el.parentNode.querySelectorAll('.ce-tab');
            tabs.forEach(t => t.classList.remove('active'));
            el.classList.add('active');
        }
        
        this.loadSavedPosts();
    }
    signupAndGo() {
        const fullName = document.getElementById("reg-name")?.value;
        const username = document.getElementById("reg-user")?.value;
        const email = document.getElementById("reg-email")?.value;
        const password = document.getElementById("reg-pass")?.value;
        const dob = document.getElementById("reg-dob")?.value;
        const gender = document.getElementById("reg-gender")?.value;

        if (!email || !password) {
            alert("Enter email & password");
            return;
        }

        const id = Date.now();
        const userData = {
            fullName,
            username,
            email,
            password,
            dob,
            gender
        };

        firebase.database().ref("users/" + id).set(userData)
        .then(() => {
            localStorage.setItem("loggedInUser", JSON.stringify({ name: fullName || username || "User", email: email }));
            this.navigate('home-screen');
            this.updateProfileUI();
        })
        .catch((error) => {
            console.error("Signup Error:", error);
            alert("Error saving data");
        });
    }

    // --- Body tab switching ---
    switchBodyTab(mode) {
        const formTab = document.getElementById('body-tab-form');
        const photoTab = document.getElementById('body-tab-photo');
        const formContainer = document.getElementById('body-form-container');
        const photoContainer = document.getElementById('body-photo-container');

        if (mode === 'form') {
            if (formTab) formTab.classList.add('active');
            if (photoTab) photoTab.classList.remove('active');
            if (formContainer) formContainer.classList.remove('hidden');
            if (photoContainer) photoContainer.classList.add('hidden');
        } else {
            if (formTab) formTab.classList.remove('active');
            if (photoTab) photoTab.classList.add('active');
            if (formContainer) formContainer.classList.add('hidden');
            if (photoContainer) photoContainer.classList.remove('hidden');
        }
    }

    // --- MediaPipe and Gemini Face Analysis ---
    async processFaceAnalysis(file) {
        if (!file) return;

        const inputContainer = document.getElementById('face-input-container');
        const loading = document.getElementById('face-loading');
        const loadingStatus = document.getElementById('face-loading-status');
        const canvas = document.getElementById('face-canvas');
        const previewContainer = document.getElementById('face-preview-container');
        const results = document.getElementById('face-results');

        // Reset UI
        if (inputContainer) inputContainer.classList.add('hidden');
        if (previewContainer) previewContainer.classList.add('hidden');
        if (results) results.classList.add('hidden');
        if (loading) loading.classList.remove('hidden');
        if (loadingStatus) loadingStatus.innerText = "Analyzing facial structure (MediaPipe)...";

        try {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise(resolve => img.onload = resolve);

            // Run MediaPipe FaceMesh
            const landmarks = await AIStylist.detectFaceLandmarks(img);

            // Draw on canvas with luxury styling
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            ctx.fillStyle = "rgba(212, 175, 55, 0.8)";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#d4af37";
            landmarks.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x * img.width, pt.y * img.height, Math.max(1, img.width * 0.003), 0, 2 * Math.PI);
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            // Extract skin tone from cheek region
            const skinColorHex = AIStylist.getSkinColorHex(img, landmarks) || "#ffdbac"; // fallback warm skin tone

            if (loadingStatus) loadingStatus.innerText = "Classified. Curating personal styling advice...";

            // Compute face shape metrics
            const analysis = AIStylist.calculateFaceShape(landmarks);

            // Persist face shape analysis metrics in this.data
            this.data.faceShape = analysis.shape;
            this.data.skinColorHex = skinColorHex;
            this.data.hasFace = true;
            this.saveData();

            // Update UI with face shape info — this always displays regardless of Gemini result
            const shapeTitle = document.getElementById('face-shape-title');
            const shapeSubtitle = document.getElementById('face-shape-subtitle');
            const skinSwatch = document.getElementById('face-skin-swatch');
            if (shapeTitle) shapeTitle.innerText = `${analysis.shape} Face Shape ✨`;
            if (shapeSubtitle) shapeSubtitle.innerText = `Proportional Ratios: L/W ${analysis.ratios.lengthToWidth}, Jaw/Cheek ${analysis.ratios.jawToCheek}`;

            // Query backend for styling recommendations — wrapped separately so face shape always shows
            const stylistAdvice = document.getElementById('face-stylist-advice');
            if (stylistAdvice) {
                stylistAdvice.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading recommendations...';
            }

            try {
                const advice = await AIStylist.queryFaceStylist(analysis.shape, analysis.ratios, skinColorHex);
                if (stylistAdvice) {
                    const parsedData = this.parseGeminiJSON(advice);
                    stylistAdvice.innerHTML = this.renderJSONToHTML(parsedData, 'faceAnalysis');
                }
            } catch (adviceErr) {
                console.error("[Fashionist] Face recommendation generation failed:", adviceErr);
                if (stylistAdvice) {
                    stylistAdvice.innerHTML = "<p class='text-muted' style='padding:16px;'><i class='fa-solid fa-circle-info'></i> Some recommendations are unavailable. Please try again.</p>";
                }
            }
            if (skinSwatch) {
                skinSwatch.style.background = skinColorHex;
                skinSwatch.title = `Detected skin tone: ${skinColorHex}`;
            }

            // Save button
            const saveBtn = document.getElementById('save-face-btn');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    this.savePost({
                        image: canvas.toDataURL(),
                        category: "face",
                        caption: `Face Analysis: ${analysis.shape} Shape`
                    });
                };
            }

            if (loading) loading.classList.add('hidden');
            if (previewContainer) previewContainer.classList.remove('hidden');
            if (results) results.classList.remove('hidden');
        } catch (error) {
            console.error("Face Analysis Failed:", error);
            alert(`Analysis failed: ${error.message}`);
            if (loading) loading.classList.add('hidden');
            if (inputContainer) inputContainer.classList.remove('hidden');
        }
    }

    // --- MediaPipe and Gemini Body Analysis ---
    async processBodyAnalysis(file) {
        if (!file) return;

        const uploadCard = document.getElementById('body-upload-card');
        const loading = document.getElementById('body-loading');
        const loadingStatus = document.getElementById('body-loading-status');
        const canvas = document.getElementById('body-canvas');
        const canvasContainer = document.getElementById('body-canvas-container');
        const results = document.getElementById('body-results');

        if (uploadCard) uploadCard.classList.add('hidden');
        if (canvasContainer) canvasContainer.classList.add('hidden');
        if (results) results.classList.add('hidden');
        if (loading) loading.classList.remove('hidden');
        if (loadingStatus) loadingStatus.innerText = "Extracting posture & skeleton coordinates...";

        try {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((resolve) => (img.onload = resolve));

            // Detect landmarks
            const landmarks = await AIStylist.detectPoseLandmarks(img);

            // Draw skeleton on canvas
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Draw pose connections
            ctx.strokeStyle = "rgba(183, 110, 121, 0.9)";
            ctx.lineWidth = Math.max(2, img.width * 0.005);
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#b76e79";

            const connections = [
                [11, 12], // Shoulders
                [11, 23], [12, 24], // Torso
                [23, 24]  // Hips
            ];

            connections.forEach(([p1, p2]) => {
                if (landmarks[p1] && landmarks[p2]) {
                    ctx.beginPath();
                    ctx.moveTo(landmarks[p1].x * img.width, landmarks[p1].y * img.height);
                    ctx.lineTo(landmarks[p2].x * img.width, landmarks[p2].y * img.height);
                    ctx.stroke();
                }
            });

            // Draw points
            ctx.fillStyle = "#d4af37";
            ctx.shadowColor = "#d4af37";
            [11, 12, 23, 24].forEach((idx) => {
                const pt = landmarks[idx];
                if (pt) {
                    ctx.beginPath();
                    ctx.arc(pt.x * img.width, pt.y * img.height, Math.max(3, img.width * 0.008), 0, 2 * Math.PI);
                    ctx.fill();
                }
            });
            ctx.shadowBlur = 0;

            if (loadingStatus) loadingStatus.innerText = "Classified. Querying styling guides...";

            const analysis = AIStylist.calculateBodyShape(landmarks);

            // Persist body shape analysis metrics in this.data
            this.data.bodyShape = analysis.shape;
            this.data.hasBody = true;
            this.saveData();

            // Update UI with body shape info — this always displays regardless of Gemini result
            const shapeTitle = document.getElementById('body-shape-title');
            const shapeSubtitle = document.getElementById('body-shape-subtitle');
            const stylistAdvice = document.getElementById('body-stylist-advice');

            if (shapeTitle) shapeTitle.innerText = `${analysis.shape} Silhouette ✨`;
            if (shapeSubtitle) shapeSubtitle.innerText = `Shoulder-to-Hip Ratio: ${analysis.ratios.shoulderToHip}`;

            // Query backend for styling recommendations — wrapped separately so body shape always shows
            if (stylistAdvice) {
                stylistAdvice.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading recommendations...';
            }

            try {
                const advice = await AIStylist.queryBodyStylist(analysis.shape, analysis.ratios);
                if (stylistAdvice) {
                    const parsedData = this.parseGeminiJSON(advice);
                    stylistAdvice.innerHTML = this.renderJSONToHTML(parsedData, 'bodyAnalysis');
                }
            } catch (adviceErr) {
                console.error("[Fashionist] Body recommendation generation failed:", adviceErr);
                if (stylistAdvice) {
                    stylistAdvice.innerHTML = "<p class='text-muted' style='padding:16px;'><i class='fa-solid fa-circle-info'></i> Some recommendations are unavailable. Please try again.</p>";
                }
            }

            // Save button setup
            const saveBtn = document.getElementById('save-body-btn');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    this.savePost({
                        image: canvas.toDataURL(),
                        category: "outfit",
                        caption: `Body Analysis: ${analysis.shape} Silhouette`
                    });
                };
            }

            if (loading) loading.classList.add('hidden');
            if (canvasContainer) canvasContainer.classList.remove('hidden');
            if (results) results.classList.remove('hidden');

        } catch (error) {
            console.error("Body Analysis Failed:", error);
            alert(`Analysis failed: ${error.message}`);
            if (loading) loading.classList.add('hidden');
            if (uploadCard) uploadCard.classList.remove('hidden');
        }
    }

    // --- Manual Body Shape Calculator via Gemini ---
    async generateBodyShapeResult(isManual = false) {
        if (!isManual) return; 

        const bust = parseFloat(document.getElementById('body-bust')?.value);
        const waist = parseFloat(document.getElementById('body-waist')?.value);
        const hip = parseFloat(document.getElementById('body-hip')?.value);
        const height = document.getElementById('body-height')?.value || "N/A";
        const weight = document.getElementById('body-weight')?.value || "N/A";
        const hair = document.getElementById('body-hair')?.value || "N/A";

        if (!bust || !waist || !hip) {
            alert("Please fill in Bust, Waist, and Hip measurements.");
            return;
        }

        const loading = document.getElementById('body-loading');
        const loadingStatus = document.getElementById('body-loading-status');
        const results = document.getElementById('body-results');
        const form = document.getElementById('body-measurements-form');

        if (form) form.classList.add('hidden');
        if (results) results.classList.add('hidden');
        if (loading) loading.classList.remove('hidden');
        if (loadingStatus) loadingStatus.innerText = "Analyzing body metrics and proportions...";

        try {
            // Determine shape mathematically
            let shape = "Rectangle";
            const maxWaistRatio = waist / Math.max(bust, hip);

            if (bust > hip * 1.05) {
                shape = "Inverted Triangle";
            } else if (hip > bust * 1.05) {
                shape = "Triangle (Pear)";
            } else if (maxWaistRatio < 0.75) {
                shape = "Hourglass";
            }

            // Persist manual body shape analysis metrics in this.data
            this.data.bodyShape = shape;
            this.data.hasBody = true;
            this.saveData();

            if (loadingStatus) loadingStatus.innerText = "Proportions calculated. Consulting Gemini Stylist...";

            const ratios = { shoulderToHip: (bust/hip).toFixed(2) };
            const advice = await AIStylist.queryBodyStylist(shape, ratios);

            // Update UI
            const shapeTitle = document.getElementById('body-shape-title');
            const shapeSubtitle = document.getElementById('body-shape-subtitle');
            const stylistAdvice = document.getElementById('body-stylist-advice');

            if (shapeTitle) shapeTitle.innerText = `${shape} Shape ✨`;
            if (shapeSubtitle) shapeSubtitle.innerText = `Measurements: ${bust} - ${waist} - ${hip} (cm)`;
            if (stylistAdvice) {
                const parsedData = this.parseGeminiJSON(advice);
                stylistAdvice.innerHTML = this.renderJSONToHTML(parsedData, 'bodyAnalysis');
            }

            // Save button
            const saveBtn = document.getElementById('save-body-btn');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    this.savePost({
                        image: "https://images.unsplash.com/photo-1549439602-43bbcb625628?q=80&w=400&fit=crop",
                        category: "outfit",
                        caption: `Body Analysis: ${shape} Shape`
                    });
                };
            }

            if (loading) loading.classList.add('hidden');
            if (results) results.classList.remove('hidden');

        } catch (error) {
            console.error("Manual Body Shape Calculation Failed:", error);
            alert("Calculation failed. Please try again.");
            if (loading) loading.classList.add('hidden');
            if (form) form.classList.remove('hidden');
        }
    }

    switchEventTab(tab) {}

    async handleEventOutfitUpload(file) {
        if (!file) return;
        
        // Show preview
        const preview = document.getElementById('event-outfit-preview');
        const previewContainer = document.getElementById('event-outfit-preview-container');
        preview.src = URL.createObjectURL(file);
        previewContainer.classList.remove('hidden');

        // Convert file to base64 for Gemini
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Get the raw base64 string after the data URI prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        this.uploadedOutfitImage = {
            data: base64Data,
            mimeType: file.type
        };
    }

    async generateEventStylistAdvice(isHaveOutfit) {
        const eventInputId = isHaveOutfit ? 'event-name-have' : 'event-name-need';
        const eventName = document.getElementById(eventInputId)?.value.trim();

        if (!eventName) {
            alert("Please type the name of the event.");
            return;
        }

        if (isHaveOutfit && !this.uploadedOutfitImage) {
            alert("Please upload a photo of your outfit first.");
            return;
        }

        const suffix = isHaveOutfit ? 'have' : 'need';
        const loading = document.getElementById(`event-${suffix}-loading`);
        const loadingStatus = document.getElementById(`event-${suffix}-loading-status`);
        const results = document.getElementById(`event-${suffix}-results`);

        if (results) results.classList.add('hidden');
        if (loading) loading.classList.remove('hidden');
        if (loadingStatus) loadingStatus.innerText = "Analyzing event styling details...";

        try {
            // Retrieve stored analysis metrics
            const faceShape = this.data.faceShape || "Not analyzed yet";
            const skinTone = this.data.skinColorHex || "Not analyzed yet";
            const bodyShape = this.data.bodyShape || "Not analyzed yet";
            const ceFeatures = this.data.ceFeatures ? `${this.data.ceMode}: ${this.data.ceFeatures}` : "None";

            let prompt = "";

            if (isHaveOutfit) {
                prompt = `${AIStylist.getBaseSystemInstruction()}

---
# TASK: EVENT STYLING — HAVE OUTFIT
I am attending a ${eventName}. I have already chosen an outfit (shown in uploaded photo).
Face Shape: ${faceShape}, Skin undertone: ${skinTone}, Body Shape: ${bodyShape}, Fix/Enhance: ${ceFeatures}.
Generate recommendations only for the active section requested.

REQUIRED JSON SCHEMA:
{
"eventStyling": {
"mode": "haveOutfit",
"hairstyleRecommendations": [""],
"makeupRecommendations": [""],
"accessoryRecommendations": [""],
"stylingTips": [""],
"colorCoordinationTips": [""]
}
}`;
            } else {
                prompt = `${AIStylist.getBaseSystemInstruction()}

---
# TASK: EVENT STYLING — NEED OUTFIT
I am attending a ${eventName} and need a complete outfit recommendation.
Face Shape: ${faceShape}, Skin undertone: ${skinTone}, Body Shape: ${bodyShape}, Fix/Enhance: ${ceFeatures}.
Generate recommendations only for the active section requested.

REQUIRED JSON SCHEMA:
{
"eventStyling": {
"mode": "needOutfit",
"outfitRecommendations": [""],
"shoesRecommendations": [""],
"bagRecommendations": [""],
"jewelryRecommendations": [""],
"makeupRecommendations": [""],
"hairstyleRecommendations": [""],
"completeLookRecommendations": [""]
}
}

Minimum recommendations:
* Outfit Recommendations: 5
* Shoes: 5
* Bags: 5
* Jewelry: 5
* Makeup: 5
* Hairstyles: 5`;
            }

            const imageBase64 = isHaveOutfit ? this.uploadedOutfitImage.data : null;
            const mimeType = isHaveOutfit ? this.uploadedOutfitImage.mimeType : null;

            // System Context is now embedded in the prompt. We can pass an empty string for the system context to queryGemini.
            const advice = await AIStylist.queryGemini(prompt, "", imageBase64, mimeType);

            const titleEl = document.getElementById(`event-${suffix}-result-title`);
            if (titleEl) {
                titleEl.innerText = `Curated Style for ${eventName}`;
            }

            const adviceEl = document.getElementById(`event-${suffix}-result-advice`);
            if (adviceEl) {
                const parsedData = this.parseGeminiJSON(advice);
                const sectionType = isHaveOutfit ? 'eventStylingHave' : 'eventStylingNeed';
                adviceEl.innerHTML = this.renderJSONToHTML(parsedData, sectionType);
            }

            // Save result setup
            const saveBtn = document.getElementById(`save-event-${suffix}-btn`);
            if (saveBtn) {
                saveBtn.onclick = () => {
                    this.savePost({
                        image: isHaveOutfit ? `data:${mimeType};base64,${imageBase64}` : "https://images.unsplash.com/photo-1539109132335-34a91bf55a03?q=80&w=400&fit=crop",
                        category: "outfit",
                        caption: `Event Styling for ${eventName}`
                    });
                };
            }

            if (loading) loading.classList.add('hidden');
            if (results) results.classList.remove('hidden');
        } catch (error) {
            console.error("Event Styling advice error:", error);
            alert("Could not generate recommendations. Please try again.");
            if (loading) loading.classList.add('hidden');
        }
    }

    parseGeminiJSON(text) {
        if (!text) {
            console.warn("parseGeminiJSON: Received empty response.");
            return {};
        }
        // Log raw Gemini response for debugging
        console.log("[Fashionist] Raw Gemini Response:", text);
        // Find first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) {
            console.error("[Fashionist] Parsing Error: No JSON object found in response.", { start, end, preview: text.substring(0, 200) });
            return {};
        }
        try {
            const parsed = JSON.parse(text.substring(start, end + 1));
            console.log("[Fashionist] Parsed JSON:", parsed);
            return parsed;
        } catch (e) {
            console.error("[Fashionist] JSON.parse failed:", e.message, "\nJSON attempted:", text.substring(start, end + 1).substring(0, 500));
            return {};
        }
    }

    renderJSONToHTML(data, type) {
        if (!data || Object.keys(data).length === 0) {
            console.warn("[Fashionist] renderJSONToHTML: Empty or null data for type:", type);
            return "<p class='text-muted' style='padding:16px;'><i class='fa-solid fa-circle-info'></i> Some recommendations are unavailable. Please try again.</p>";
        }
        let html = '';
        let sectionsRendered = 0;

        // Helper: safely get array, filter out placeholder empty strings
        const safeArr = (arr) => {
            if (!arr || !Array.isArray(arr)) return [];
            return arr.filter(item => item && String(item).trim() !== '');
        };

        // Helper to parse affiliate pipe format and render list
        const renderList = (arr, title) => {
            const items = safeArr(arr);
            if (items.length === 0) return "<p class='text-muted' style='font-size:0.85rem;'>No recommendations available.</p>";
            
            // List of sections that should NEVER have affiliate icons
            const noIconSections = ['tone', 'tones', 'best colors', 'colors to avoid', 'haircuts', 'best haircuts', 'hairstyles', 'best hairstyles', 'hair colors', 'best hair colors', 'hair colors to avoid', 'face shape', 'body shape', 'best fabrics', 'fabrics to avoid', 'best necklines', 'styling tips', 'contouring techniques', 'best contour style'];
            const shouldHideIcon = title && noIconSections.includes(title.toLowerCase().trim());
            
            // Regex to remove clothing words from color sections
            const isColorSection = title && title.toLowerCase().includes('color');
            const clothingRegex = /\b(Dress|Blouse|Shirt|Top|Skirt|Sweater|Coat|Trousers|Jacket)\b/gi;

            let listHtml = '<ul class="result-list" style="padding-left:20px; list-style-type:disc; margin-bottom:12px;">';
            items.forEach(item => {
                let name = String(item);
                let url = '';

                // Extract name and url (ignoring price)
                if (typeof item === 'string' && item.includes('|')) {
                    const parts = item.split('|').map(s => s.trim());
                    name = parts[0] || 'Item';
                    // parts[1] is price (ignored)
                    url = parts[2] || '';
                }

                // Clean up color names
                if (isColorSection) {
                    name = name.replace(clothingRegex, '').trim();
                    // Remove trailing hyphens or spaces left over
                    name = name.replace(/[-\s]+$/, '');
                }

                if (url && url !== 'null' && url.startsWith('http') && !shouldHideIcon) {
                    listHtml += `<li style="margin-bottom:6px; font-size:0.95rem;">${this.escapeHTML(name)} <a href="${this.escapeHTML(url)}" target="_blank" rel="noopener" style="text-decoration:none; margin-left:4px;" title="Shop Product">🔗</a></li>`;
                } else {
                    listHtml += `<li style="margin-bottom:6px; font-size:0.95rem;">${this.escapeHTML(name)}</li>`;
                }
            });
            listHtml += '</ul>';
            return listHtml;
        };

        // Render a CSS card wrapper around sections
        const renderCard = (title, icon, content) => {
            if (!content || !content.trim()) return '';
            return `
            <div class="card premium-card" style="margin-bottom: 24px; border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div class="card-header" style="background: linear-gradient(135deg, var(--bg-light) 0%, #fff 100%); padding: 16px 20px; border-bottom: 1px solid var(--border-light);">
                    <h3 style="margin: 0; color: var(--accent-rose-gold); font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="${icon}"></i> ${this.escapeHTML(title)}
                    </h3>
                </div>
                <div class="card-body" style="padding: 20px;">
                    ${content}
                </div>
            </div>`;
        };

        // Render a single section — if it fails, log and skip, never crash
        const renderSection = (title, items) => {
            try {
                if (items === undefined || items === null) return '';
                let sec = `<h3 class="result-heading mt-4 mb-2" style="color:var(--accent-rose-gold); font-size:1.1rem; border-bottom:1px solid var(--border-light); padding-bottom:4px;">${this.escapeHTML(title)}</h3>`;
                if (typeof items === 'string') {
                    sec += `<p style="margin-bottom:12px; font-size:0.95rem;">${this.escapeHTML(items)}</p>`;
                } else {
                    sec += renderList(items, title);
                }
                sectionsRendered++;
                return sec;
            } catch (sectionErr) {
                console.error(`[Fashionist] Failed to render section "${title}":`, sectionErr);
                return '';
            }
        };

        try {
            if (type === 'faceAnalysis') {
                // Use optional chaining — supports both wrapped and flat responses
                const d = data?.faceAnalysis || data;
                
                // Card 1: Color Analysis (Only if color data exists)
                let colorContent = '';
                colorContent += renderSection("Tone", d?.tone);
                colorContent += renderSection("Best Colors", d?.bestColors);
                colorContent += renderSection("Colors To Avoid", d?.colorsToAvoid);
                colorContent += renderSection("Best Metal Tones", d?.bestMetalTones);
                html += renderCard("Color Analysis", "fa-solid fa-palette", colorContent);

                // Card 2: Hair Recommendations
                let hairContent = '';
                hairContent += renderSection("Best Haircuts", d?.bestHaircuts || d?.haircuts); // Fallback for old schema if needed
                hairContent += renderSection("Best Hairstyles", d?.bestHairstyles);
                hairContent += renderSection("Best Hair Colors", d?.bestHairColors || d?.hairColors);
                hairContent += renderSection("Hair Colors To Avoid", d?.hairColorsToAvoid);
                html += renderCard("Hair Recommendations", "fa-solid fa-scissors", hairContent);

                // Card 3: Glasses Recommendations
                let glassesContent = '';
                glassesContent += renderSection("Best Glasses", d?.bestGlasses || d?.glasses);
                glassesContent += renderSection("Frames To Avoid", d?.framesToAvoid);
                html += renderCard("Glasses Recommendations", "fa-solid fa-glasses", glassesContent);

                // Card 4: Makeup Recommendations (Only if color data exists)
                let makeupContent = '';
                makeupContent += renderSection("Best Lipstick Shades", d?.bestLipstickShades);
                makeupContent += renderSection("Best Blush Shades", d?.bestBlushShades);
                makeupContent += renderSection("Best Eye Makeup", d?.bestEyeMakeup);
                makeupContent += renderSection("Best Contour Style", d?.bestContourStyle);
                html += renderCard("Makeup Recommendations", "fa-solid fa-wand-magic-sparkles", makeupContent);

                // Card 5: Jewelry & Accessories
                let accessoriesContent = '';
                accessoriesContent += renderSection("Best Earrings", d?.bestEarrings || d?.earrings);
                accessoriesContent += renderSection("Best Necklines", d?.bestNecklines);
                accessoriesContent += renderSection("Best Necklaces", d?.bestNecklaces);
                accessoriesContent += renderSection("Best Headwear", d?.bestHeadwear);
                html += renderCard("Jewelry & Accessories", "fa-solid fa-gem", accessoriesContent);

            } else if (type === 'bodyAnalysis') {
                const d = data?.bodyAnalysis || data;
                html += renderSection("Body Shape", d?.bodyShape);
                html += renderSection("Recommended Clothes", d?.recommendedClothes);
                html += renderSection("Clothes To Avoid", d?.clothesToAvoid);
                html += renderSection("Best Fabrics", d?.bestFabrics);
                html += renderSection("Fabrics To Avoid", d?.fabricsToAvoid);

            } else if (type === 'fixEnhance') {
                const d = data?.fixEnhance || data;
                html += renderSection("Your Goal", d?.userGoal);
                html += renderSection("Clothing Suggestions", d?.clothingSuggestions);
                html += renderSection("Hair Suggestions", d?.hairSuggestions);
                html += renderSection("Makeup Suggestions", d?.makeupSuggestions);
                html += renderSection("Accessories", d?.accessories);

            } else if (type === 'eventStylingHave') {
                const es = data?.eventStyling || data;
                const d = es?.haveOutfit || es;
                html += renderSection("Hairstyle Recommendation", d?.hairstyleRecommendations);
                html += renderSection("Makeup Recommendation", d?.makeupRecommendations);
                html += renderSection("Accessory Recommendation", d?.accessoryRecommendations);
                html += renderSection("Styling Tips", d?.stylingTips);
                html += renderSection("Color Coordination Tips", d?.colorCoordinationTips);

            } else if (type === 'eventStylingNeed') {
                const es = data?.eventStyling || data;
                const d = es?.needOutfit || es;
                html += renderSection("Outfit Recommendation", d?.outfitRecommendations);
                html += renderSection("Shoes Recommendation", d?.shoesRecommendations);
                html += renderSection("Bag Recommendation", d?.bagRecommendations);
                html += renderSection("Jewelry Recommendation", d?.jewelryRecommendations);
                html += renderSection("Makeup Recommendation", d?.makeupRecommendations);
                html += renderSection("Hairstyle Recommendation", d?.hairstyleRecommendations);
                html += renderSection("Complete Look", d?.completeLookRecommendations);
            }
        } catch (renderErr) {
            console.error("[Fashionist] renderJSONToHTML error:", renderErr);
            // Don't return full error — show whatever was rendered so far
            if (html.trim()) {
                html += "<p class='text-muted' style='padding:8px; font-size:0.85rem;'><i class='fa-solid fa-circle-info'></i> Some recommendations are unavailable.</p>";
                return html;
            }
            return "<p class='text-muted' style='padding:16px;'><i class='fa-solid fa-triangle-exclamation'></i> Some recommendations are unavailable. Please try again.</p>";
        }

        console.log(`[Fashionist] Rendered ${sectionsRendered} sections for type: ${type}`);

        if (!html.trim()) {
            return "<p class='text-muted' style='padding:16px;'><i class='fa-solid fa-circle-info'></i> Some recommendations are unavailable. Please try again.</p>";
        }
        return html;
    }

    escapeHTML(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    async generateAI() {
        const input = document.getElementById("ai-input")?.value;
        const output = document.getElementById("ai-result");

        if (!input || !output) {
            if (!input) alert("Type something");
            return;
        }

        output.innerText = "Analyzing...";

        try {
            const apiKey = AIStylist.getApiKey();
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a fashion expert AI. Analyze this: ${input}. Give output in this format: Analysis Type:, Best Choices:, Avoid:, Tips:, Optional Outfit Idea:`
                            }]
                        }]
                    })
                }
            );

            const data = await response.json();
            const result = data.candidates[0].content.parts[0].text;
            output.innerText = result;

        } catch (error) {
            console.error("AI Error:", error);
            output.innerText = "Error. Try again.";
        }
    }
    saveCustomApiKey(val) {
        if (val) {
            localStorage.setItem("customGeminiKey", val.trim());
            alert("✓ Custom Gemini API Key saved locally!");
        } else {
            localStorage.removeItem("customGeminiKey");
            alert("Custom API Key cleared. Falling back to default.");
        }
    }
}

const app = new FashionistApp();

// Consistently handle late-loading assets if needed, but app init is already handled in constructor
window.addEventListener("load", () => {
    console.log("FashionistApp: Window loaded.");
});
