const CO_CREATORS = {
    "sarah_fashionist_com": {
        name: "StylistSarah",
        username: "stylistsarah",
        email: "sarah@fashionist.com",
        bio: "Fashion & Color Analysis Expert ✨ Helping you find your best shades.",
        profilePic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&fit=crop",
        posts: [
            {
                id: 1719800000000,
                media: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&fit=crop"],
                caption: "Summer Capsule Wardrobe Essentials ☀️ Soft pastel shades work best for light spring color palette. #styleideas",
                type: "photo",
                timestamp: 1719800000000
            },
            {
                id: 1719801000000,
                media: ["https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=400&fit=crop"],
                caption: "Styling a beige blazer for a casual chic office look. Neutral tones make it easy to mix and match. #officestyle",
                type: "photo",
                timestamp: 1719801000000
            }
        ]
    },
    "ai_fashionist_com": {
        name: "FashionistAI",
        username: "fashionistai",
        email: "ai@fashionist.com",
        bio: "AI Stylist & Trendsetter. Powered by state-of-the-art beauty recommendations.",
        profilePic: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&fit=crop",
        posts: [
            {
                id: 1719802000000,
                media: ["https://images.unsplash.com/photo-1539109132335-34a91bf55a03?q=80&w=400&fit=crop"],
                caption: "AI predicted fashion trends for this season: Futuristic metal accents and structured shoulders. #fashionAI",
                type: "photo",
                timestamp: 1719802000000
            }
        ]
    },
    "zara_fashionist_com": {
        name: "ZaraTrending",
        username: "zaratrending",
        email: "zara@fashionist.com",
        bio: "OOTD | Fall Lookbooks | Fashion Reel Creator",
        profilePic: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150&fit=crop",
        posts: [
            {
                id: 1719803000000,
                media: ["https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&fit=crop"],
                caption: "OOTD! 🤍 Fall lookbook. Comfortable layers and warm earthy colors. #fallfashion",
                type: "video",
                timestamp: 1719803000000
            }
        ]
    },
    "mia_fashionist_com": {
        name: "MakeupByMia",
        username: "makeupbymia",
        email: "mia@fashionist.com",
        bio: "Beauty & Glam 💄 Glamour makeup styling for all seasons.",
        profilePic: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&fit=crop",
        posts: [
            {
                id: 1719804000000,
                media: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&fit=crop"],
                caption: "Monochrome makeup styling using rose pink tones. Perfect match for cool summer skin tones. #makeupinspiration",
                type: "photo",
                timestamp: 1719804000000
            }
        ]
    }
};

class FashionistApp {
    constructor() {
        this.currentScreen = 'splash-screen';
        this.bottomNavRoutes = ['home-screen', 'feed-screen', 'saved-screen', 'profile-screen'];
        this.data = this.loadData();
        this.isDark = localStorage.getItem('theme') !== 'light';
        
        this.applyTheme();
        this.injectDynamicScreens();
        this.renderPremiumScreen();
        
        // Immediate init since script is at body end
        this.init();
        this.seedDatabaseIfNeeded();
        this.cacheAllUsers();
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

    seedDatabaseIfNeeded() {
        firebase.database().ref("users").once("value", (snapshot) => {
            const users = snapshot.val() || {};
            let updates = {};
            let hasNew = false;
            for (const key in CO_CREATORS) {
                if (!users[key]) {
                    const creator = CO_CREATORS[key];
                    updates[`users/${key}`] = {
                        name: creator.name,
                        username: creator.username,
                        email: creator.email,
                        bio: creator.bio,
                        profilePic: creator.profilePic,
                        password: "password"
                    };
                    creator.posts.forEach(post => {
                        updates[`posts/${key}/${post.id}`] = post;
                    });
                    hasNew = true;
                }
            }
            if (hasNew) {
                firebase.database().ref().update(updates)
                    .then(() => {
                        console.log("Database seeded successfully!");
                        this.cacheAllUsers();
                    })
                    .catch(err => console.error("Database seeding failed:", err));
            }
        });
    }

    cacheAllUsers(callback) {
        firebase.database().ref("users").once("value", snapshot => {
            this._usersCache = snapshot.val() || {};
            if (callback) callback();
        });
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
            
            // Bind search overlay events
            const searchInput = document.getElementById("search-input-field");
            if (searchInput) {
                searchInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        this.executeSearch();
                    }
                };
                searchInput.oninput = () => this.executeSearch();
            }

            // Bind profile tabs
            this.initProfileTabs();

            // Init chats list
            this.initChats();
            const chatSearchInput = document.getElementById("chat-search-input");
            if (chatSearchInput) {
                chatSearchInput.oninput = () => this.renderChatsList();
            }
            const chatMsgInput = document.getElementById("chat-message-input");
            if (chatMsgInput) {
                chatMsgInput.onkeypress = (e) => {
                    if (e.key === 'Enter') this.sendChatMessage();
                };
            }
            
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
            if (screenId === 'premium-screen') {
                this.renderPremiumScreen();
            }
            if (screenId === 'saved-screen') {
                this.loadSavedPosts();
            }
            if (screenId === 'profile-screen') {
                const user = this.getLoggedInUser();
                const viewingEmail = this._currentViewingUserEmail || (user ? user.email : "");
                this.updateProfileHeader(viewingEmail);
                this.loadProfilePosts(viewingEmail);
            }
            if (screenId === 'edit-profile-screen') {
                this.loadProfile();
            }
            if (screenId === 'inbox-screen') {
                this.renderChatsList();
            }
            if (screenId === 'feed-screen') {
                const icon = document.getElementById("feed-like-icon");
                const countEl = document.getElementById("feed-like-count");
                if (icon && countEl) {
                    const isLiked = localStorage.getItem("feed_is_liked") === "true";
                    let count = 12450;
                    const storedCount = localStorage.getItem("feed_likes_count");
                    if (storedCount) count = parseInt(storedCount, 10);

                    if (isLiked) {
                        icon.classList.remove("fa-regular");
                        icon.classList.add("fa-solid", "heart-active");
                    } else {
                        icon.classList.remove("fa-solid", "heart-active");
                        icon.classList.add("fa-regular");
                    }
                    countEl.innerText = count.toLocaleString();
                }
            }
            if (screenId === 'settings-screen') {
                const privateEl = document.getElementById("settings-private-profile");
                const tfaEl = document.getElementById("settings-tfa");
                const notificationsEl = document.getElementById("settings-notifications");
                
                if (privateEl) privateEl.checked = localStorage.getItem('settings_private') === 'true';
                if (tfaEl) tfaEl.checked = localStorage.getItem('settings_tfa') === 'true';
                if (notificationsEl) notificationsEl.checked = localStorage.getItem('settings_notifications') === 'true';
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

    selectPlan(planId) {
        this._selectedPlanId = planId;
        this.renderPremiumScreen();
    }

    renderPremiumScreen() {
        const container = document.getElementById('premium-screen');
        if (!container || !window.PREMIUM_PLANS_CONFIG) return;

        const cfg = window.PREMIUM_PLANS_CONFIG;
        const tier = cfg.tier;
        const plans = cfg.plans;
        const methods = cfg.paymentMethods;
        const currentSelectedPlan = this._selectedPlanId || (plans.find(p => p.selectedByDefault)?.id || plans[0]?.id);

        let plansHtml = '';
        plans.forEach(plan => {
            const isSelected = plan.id === currentSelectedPlan;
            const borderStyle = isSelected ? 'border:2px solid var(--accent-rose-gold);' : 'border:1px solid var(--border-light);';
            const savingsHtml = plan.savingsText ? `<p class="text-success" style="${plan.savingsStyle || ''}">${plan.savingsText}</p>` : '';
            
            plansHtml += `
                <div class="card" style="${plan.cardStyle || ''} ${borderStyle}" onclick="app.selectPlan('${plan.id}')">
                    <h4 style="margin:0;">${plan.name}</h4>
                    <h2 style="margin:4px 0;">${plan.price}</h2>
                    ${savingsHtml}
                </div>
            `;
        });

        let methodsHtml = '';
        methods.forEach(method => {
            // NOTE: Payment method buttons are non-functional UI placeholders.
            // Actual payment processing will be handled when Lemon Squeezy is connected.
            methodsHtml += `
                <div class="payment-btn ${method.extraClass || ''}" onclick="app.triggerPayment('${method.id}', '${currentSelectedPlan}')">
                    ${method.iconHtml} ${method.name}
                </div>
            `;
        });

        container.innerHTML = `
            <div class="top-bar mt-4">
                <div class="btn-icon" onclick="app.navigate('home-screen')"><i class="fa-solid fa-xmark"></i></div>
                <h2 class="title" style="font-size: 1.2rem;">${cfg.headerTitle || 'Fashionist Premium'}</h2>
                <div style="width:44px;"></div>
            </div>
            
            <div class="card premium-card text-center mb-8">
                <i class="${tier.iconClass}" style="${tier.iconStyle}"></i>
                <h2>${tier.name}</h2>
                <p>${tier.description}</p>
            </div>
            
            <div style="display:flex; gap:16px; margin-bottom:24px;">
                ${plansHtml}
            </div>
            
            <h4 class="mb-4">Select Payment Method</h4>
            ${methodsHtml}
        `;
    }

    triggerPayment(methodId = null, planId = null) {
        const cfg = window.PREMIUM_PLANS_CONFIG;
        const selectedPlanId = planId || this._selectedPlanId || 'monthly';
        const selectedPlan = cfg?.plans?.find(p => p.id === selectedPlanId) || cfg?.plans?.[0];

        // =========================================================================
        // LEMON SQUEEZY CHECKOUT INTEGRATION HOOK
        // =========================================================================
        // When ready to trigger live Lemon Squeezy Checkout:
        // if (cfg && cfg.lemonSqueezy && cfg.lemonSqueezy.enabled) {
        //     const variantId = selectedPlan?.lemonSqueezyVariantId;
        //     // Open Lemon Squeezy Overlay Checkout:
        //     // LemonSqueezy.Url.Open(`https://${cfg.lemonSqueezy.storeId}.lemonsqueezy.com/checkout/buy/${variantId}`);
        //     return;
        // }
        // =========================================================================

        const methodName = methodId ? (cfg?.paymentMethods?.find(m => m.id === methodId)?.name || methodId) : "Payment Gateway";
        if(confirm(`Connecting to ${methodName} for ${selectedPlan?.name || ''} plan (${selectedPlan?.price || ''})... (Simulation). Purchase Fashionist Premium?`)) {
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

Relevance Rule: The Fix & Enhance section should focus on practical styling solutions. Prioritize: Clothing, Colors, Fabrics, Hair, and Accessories. Keep all recommendations concise, scannable, and easy to apply.

Color Suggestions: Provide colors that help achieve the user's styling goal (e.g., Dark lower half, Bright upper half, Monochrome styling, Deep neutral tones, Low/High contrast palette). Use the user's color analysis whenever possible.

Fabric Suggestions: Recommend fabrics that help improve the selected concern. Examples: Structured cotton, Linen blends, Soft crepe, Lightweight wool, Fluid satin, Stretch denim, Matte fabrics. Also include "### Fabrics To Avoid" when relevant (e.g., Stiff denim, Heavy velvet, Shiny satin, Bulky knits).

Generate recommendations only for the active section requested.

REQUIRED JSON SCHEMA:
{
"fixEnhance": {
"userGoal": "${modeText} ${features}",
"clothingSuggestions": [""],
"hairSuggestions": [""],
"colorSuggestions": [""],
"fabricSuggestions": [""],
"accessories": [""]
}
}

Minimum recommendations:
* Clothing Suggestions: 8
* Hair Suggestions: 6
* Color Suggestions: 6
* Fabric Suggestions: 6
* Accessories: 6`;
            
            const advice = await AIStylist.queryGemini(prompt);
            
            const contentContainer = document.getElementById('ce-result-content');
            if (contentContainer) {
                const parsedData = this.parseGeminiJSON(advice);
                contentContainer.innerHTML = this.renderJSONToHTML(parsedData, 'fixEnhance');
            }
            
            // Set up save button
            const saveBtn = document.getElementById('save-ce-btn');
            const cePostData = {
                image: "https://images.unsplash.com/photo-1595777457583-95e059f581ce?q=80&w=400&fit=crop",
                category: "other",
                caption: `${isConceal ? 'Fix' : 'Enhance'} Guide: ${features}`
            };
            this._initSaveButton(saveBtn, cePostData);
            
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


// AUTH SYSTEM
authenticate(provider) {

    if (provider === 'Logout') {
        this.logout();
        return;
    }

    const overlay = document.getElementById('auth-spinner');
    const text = document.getElementById('auth-text');

    overlay.classList.remove('hidden');
    text.innerText = `Connecting via ${provider}...`;

    // Ensure loggedInUser session is created so loading components don't hang
    if (!localStorage.getItem("loggedInUser")) {
        const mockName = provider === 'Apple' ? 'Apple User' : 'Fashionist User';
        const mockEmail = (provider === 'Apple' ? 'apple_user' : 'user_' + Date.now()) + '@fashionist.com';
        localStorage.setItem("loggedInUser", JSON.stringify({ 
            name: mockName, 
            email: mockEmail,
            username: mockName.toLowerCase().replace(/\s+/g, ''),
            bio: "Fashion enthusiast and trendsetter ✨"
        }));
    }

    setTimeout(() => {
        text.innerText = "Verifying Credentials...";
        setTimeout(() => {
            overlay.classList.add('hidden');
            this.navigate('home-screen');
            this.claimDailyReward();
            this.updateProfileUI(); // Ensure greeting and profile update
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
            <div id="feed-posts-scroll-container" style="flex: 1; overflow-y: auto; max-height: 80vh; padding-bottom: 80px; -webkit-overflow-scrolling: touch;">
                <!-- Dynamically loaded posts -->
            </div>
        `;
        appContainer.appendChild(feedScreen);
        
        // --- Inbox ---
        const inboxScreen = document.createElement('div');
        inboxScreen.id = 'inbox-screen'; inboxScreen.className = 'screen hidden';
        inboxScreen.innerHTML = `
            <div class="top-bar mt-4"><div class="btn-icon" onclick="app.navigate('home-screen')"><i class="fa-solid fa-arrow-left"></i></div><h2 class="title" style="font-size: 1.5rem;">Messages</h2><div style="width:44px;"></div></div>
            <div class="input-container mt-4" style="margin-bottom: 16px;">
                <input type="text" class="input-field" placeholder="Search chats..." id="chat-search-input" style="padding: 10px 16px; font-size: 0.9rem;">
            </div>
            <div id="chats-list" style="display:flex; flex-direction:column; gap:8px;"></div>
        `;
        appContainer.appendChild(inboxScreen);

        // --- Chat Thread Screen ---
        const chatScreen = document.createElement('div');
        chatScreen.id = 'chat-screen'; chatScreen.className = 'screen hidden';
        chatScreen.innerHTML = `
            <div class="top-bar mt-4" style="border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
                <div class="btn-icon" onclick="app.navigate('inbox-screen')"><i class="fa-solid fa-arrow-left"></i></div>
                <div style="display:flex; align-items:center; gap:10px; flex:1; margin-left:8px;">
                    <div class="avatar" style="width:36px; height:36px; overflow:hidden; border-radius:50%;" id="chat-thread-avatar">
                        <img src="" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div>
                        <h4 style="margin:0; font-size:1rem;" id="chat-thread-name">Sarah</h4>
                        <span style="font-size:0.75rem; color:var(--accent-success);" id="chat-thread-status">Active now</span>
                    </div>
                </div>
                <div style="width:44px;"></div>
            </div>
            
            <div id="chat-messages-container" style="flex: 1; overflow-y: auto; padding: 16px 8px; display:flex; flex-direction:column; gap:12px; margin-bottom: 80px; max-height: 60vh;">
                <!-- Chat messages bubble -->
            </div>
            
            <div class="comment-bar" style="position: absolute; bottom: 0; left: 0; right: 0; background: var(--bg-primary); z-index: 10;">
                <input type="text" class="comment-input-box" id="chat-message-input" placeholder="Message...">
                <i class="fa-solid fa-paper-plane text-rose" style="font-size:1.2rem; cursor:pointer;" onclick="app.sendChatMessage()"></i>
            </div>
        `;
        appContainer.appendChild(chatScreen);

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
                
                <button class="btn save-btn save-btn-unsaved mt-4" id="save-face-btn"><i class="fa-regular fa-bookmark"></i> Save</button>
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
                <button class="btn save-btn save-btn-unsaved mt-4" id="save-body-btn"><i class="fa-regular fa-bookmark"></i> Save</button>
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
                <button class="btn save-btn save-btn-unsaved mt-4" id="save-event-have-btn"><i class="fa-regular fa-bookmark"></i> Save</button>
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
                <button class="btn save-btn save-btn-unsaved mt-4" id="save-event-need-btn"><i class="fa-regular fa-bookmark"></i> Save</button>
            </div>
        `;
        appContainer.appendChild(eventNeedScreen);
        
        const settingsScreen = document.createElement('div');
        settingsScreen.id = 'settings-screen'; settingsScreen.className = 'screen hidden';
        settingsScreen.innerHTML = `
            <div class="top-bar mt-4"><div class="btn-icon" onclick="app.navigate('profile-screen')"><i class="fa-solid fa-arrow-left"></i></div><h2 class="title" style="font-size: 1.2rem;">Settings</h2><div style="width:44px;"></div></div>
            
            <div class="card" style="padding:0;">
                <h4 class="text-muted" style="padding:16px 16px 8px 16px; margin:0; font-size:0.85rem; text-transform:uppercase;">Account & Privacy</h4>
                <div class="setting-item" style="padding: 16px; cursor:pointer;" onclick="app.navigate('edit-profile-screen')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-user" style="font-size:1.2rem; min-width:24px;"></i><span>Edit Profile</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
                <div class="setting-item" style="padding: 16px;">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-lock" style="font-size:1.2rem; min-width:24px;"></i><span>Private Account</span></div>
                    <label class="switch"><input type="checkbox" id="settings-private-profile" onchange="localStorage.setItem('settings_private', this.checked)"><span class="slider"></span></label>
                </div>
                <div class="setting-item" style="padding: 16px; border-bottom:none;">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-shield-halved" style="font-size:1.2rem; min-width:24px;"></i><span>Two-Factor Auth</span></div>
                    <label class="switch"><input type="checkbox" id="settings-tfa" onchange="localStorage.setItem('settings_tfa', this.checked)"><span class="slider"></span></label>
                </div>
            </div>

            <div class="card" style="padding:0;">
                <h4 class="text-muted" style="padding:16px 16px 8px 16px; margin:0; font-size:0.85rem; text-transform:uppercase;">App Settings</h4>
                <div class="setting-item" style="padding: 16px;">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-moon" style="font-size:1.2rem; min-width:24px;"></i><span>Appearance (Dark Mode)</span></div>
                    <label class="switch"><input type="checkbox" id="theme-toggle" onchange="app.toggleTheme()"><span class="slider"></span></label>
                </div>
                <div class="setting-item" style="padding: 16px;">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-bell" style="font-size:1.2rem; min-width:24px;"></i><span>Push Notifications</span></div>
                    <label class="switch"><input type="checkbox" id="settings-notifications" onchange="localStorage.setItem('settings_notifications', this.checked)"><span class="slider"></span></label>
                </div>
                <div class="setting-item" style="padding: 16px; border-bottom:none; cursor:pointer;" onclick="alert('Language Selected: English')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-globe" style="font-size:1.2rem; min-width:24px;"></i><span>Language</span></div>
                    <span class="text-muted">English</span>
                </div>
            </div>

            <div class="card" style="padding:0;">
                <h4 class="text-muted" style="padding:16px 16px 8px 16px; margin:0; font-size:0.85rem; text-transform:uppercase;">More</h4>
                <div class="setting-item" style="padding: 16px; cursor:pointer;" onclick="window.location.href = 'mailto:support@fashionist.com?subject=Fashionist Support Request'">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-regular fa-circle-question" style="font-size:1.2rem; min-width:24px;"></i><span>Help & Support</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
                <div class="setting-item" style="padding: 16px; border-bottom:none; cursor:pointer;" onclick="alert('Fashionist Premium Stylist\nVersion: 4.5.2\nPowered by Gemini 1.5 Pro & MediaPipe FaceMesh')">
                    <div style="display:flex; align-items:center; gap:12px;"><i class="fa-solid fa-circle-info" style="font-size:1.2rem; min-width:24px;"></i><span>About App</span></div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                </div>
            </div>

            <button class="btn btn-secondary mt-4 mb-8" style="background-color: var(--bg-primary); border-color:var(--accent-error); color:var(--accent-error);" onclick="app.authenticate('Logout')"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out</button>
        `;
        appContainer.appendChild(settingsScreen);

        // --- PHASE 4: New Sub-Screens for Social Features ---
        const postDetailScreen = document.createElement('div');
        postDetailScreen.id = 'post-detail-screen'; postDetailScreen.className = 'screen hidden';
        postDetailScreen.innerHTML = `
            <div class="top-bar mt-4">
                <div class="btn-icon" onclick="app.goBack()"><i class="fa-solid fa-arrow-left"></i></div>
                <h2 class="title" style="font-size: 1.2rem;">Post Details</h2>
                <div style="width:44px;"></div>
            </div>
            <div id="post-detail-container" class="mt-4" style="margin-bottom: 80px;">
                <!-- Loaded dynamically -->
            </div>
        `;
        appContainer.appendChild(postDetailScreen);

        const followersScreen = document.createElement('div');
        followersScreen.id = 'followers-screen'; followersScreen.className = 'screen hidden';
        followersScreen.innerHTML = `
            <div class="top-bar mt-4">
                <div class="btn-icon" onclick="app.goBack()"><i class="fa-solid fa-arrow-left"></i></div>
                <h2 class="title" style="font-size: 1.2rem;">Followers</h2>
                <div style="width:44px;"></div>
            </div>
            <div id="followers-list-container" class="mt-4" style="display:flex; flex-direction:column; gap:12px; padding-bottom: 80px;">
                <!-- Loaded dynamically -->
            </div>
        `;
        appContainer.appendChild(followersScreen);

        const followingScreen = document.createElement('div');
        followingScreen.id = 'following-screen'; followingScreen.className = 'screen hidden';
        followingScreen.innerHTML = `
            <div class="top-bar mt-4">
                <div class="btn-icon" onclick="app.goBack()"><i class="fa-solid fa-arrow-left"></i></div>
                <h2 class="title" style="font-size: 1.2rem;">Following</h2>
                <div style="width:44px;"></div>
            </div>
            <div id="following-list-container" class="mt-4" style="display:flex; flex-direction:column; gap:12px; padding-bottom: 80px;">
                <!-- Loaded dynamically -->
            </div>
        `;
        appContainer.appendChild(followingScreen);
    }

    // --- SAVED / BOOKMARK SYSTEM ---

    _getSavedKey(user) {
        return "fashionistSavedPosts_" + user.email;
    }

    _getSavedList(user) {
        try {
            const stored = localStorage.getItem(this._getSavedKey(user));
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Local save parse error:", e);
            return [];
        }
    }

    _writeSavedList(user, list) {
        localStorage.setItem(this._getSavedKey(user), JSON.stringify(list));
    }

    isPostSaved(postData) {
        const user = this.getLoggedInUser();
        if (!user) return false;
        const list = this._getSavedList(user);
        return list.some(item => item.image === postData.image && item.caption === postData.caption);
    }

    // Legacy compat: redirect to toggleSave
    savePost(postData) {
        this.toggleSave(postData, null);
    }

    toggleSave(postData, btnEl) {
        const user = this.getLoggedInUser();
        if (!user) {
            alert("Please log in to save posts.");
            return;
        }

        let list = this._getSavedList(user);
        const existingIndex = list.findIndex(item => item.image === postData.image && item.caption === postData.caption);

        if (existingIndex > -1) {
            // --- UNSAVE ---
            const removed = list.splice(existingIndex, 1)[0];
            this._writeSavedList(user, list);
            this._updateSaveBtnUI(btnEl, false);
            this._showSaveToast(false);

            // Firebase background remove
            const emailKey = user.email.replace(/\./g, '_');
            if (removed && removed.id) {
                firebase.database().ref("saved/" + emailKey + "/" + removed.id).remove()
                .catch(err => console.warn("Firebase remove failed:", err));
            }
        } else {
            // --- SAVE ---
            const id = Date.now();
            const itemToSave = {
                id: id,
                image: postData.image || "",
                category: postData.category || "other",
                caption: postData.caption || "",
                timestamp: id
            };
            list.push(itemToSave);
            this._writeSavedList(user, list);
            this._updateSaveBtnUI(btnEl, true);
            this._showSaveToast(true);

            // Firebase background save
            const emailKey = user.email.replace(/\./g, '_');
            firebase.database().ref("saved/" + emailKey + "/" + id).set(itemToSave)
            .catch(err => console.warn("Firebase save failed:", err));
        }

        // Refresh saved screen if open
        if (this.currentScreen === 'saved-screen') {
            this.loadSavedPosts();
        }
    }

    unsavePost(postId, emailKey) {
        const user = this.getLoggedInUser();
        if (!user) return;
        let list = this._getSavedList(user);
        list = list.filter(item => String(item.id) !== String(postId));
        this._writeSavedList(user, list);

        // Firebase remove
        firebase.database().ref("saved/" + emailKey + "/" + postId).remove()
        .catch(err => console.warn("Firebase remove failed:", err));

        this.loadSavedPosts();
    }

    _updateSaveBtnUI(btnEl, isSaved) {
        if (!btnEl) return;
        if (isSaved) {
            btnEl.innerHTML = '<i class="fa-solid fa-bookmark"></i> Saved';
            btnEl.classList.add('save-btn-saved');
            btnEl.classList.remove('save-btn-unsaved');
        } else {
            btnEl.innerHTML = '<i class="fa-regular fa-bookmark"></i> Save';
            btnEl.classList.add('save-btn-unsaved');
            btnEl.classList.remove('save-btn-saved');
        }
    }

    _showSaveToast(isSaved) {
        let toast = document.getElementById('fashionist-save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'fashionist-save-toast';
            toast.className = 'fashionist-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = isSaved
            ? '<i class="fa-solid fa-bookmark"></i> Added to Saved'
            : '<i class="fa-regular fa-bookmark"></i> Removed from Saved';
        toast.classList.add('toast-show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('toast-show'), 2500);
    }

    _initSaveButton(btnEl, postData) {
        if (!btnEl) return;
        const saved = this.isPostSaved(postData);
        this._updateSaveBtnUI(btnEl, saved);
        btnEl.onclick = () => this.toggleSave(postData, btnEl);
    }

    loadSavedPosts() {
        const user = this.getLoggedInUser();
        const container = document.getElementById("saved-container");
        if (!container) return;

        if (!user) {
            container.innerHTML = `<div style="grid-column: span 3; text-align:center; padding: 60px 20px;">
                <i class="fa-regular fa-user text-muted mb-4" style="font-size: 3rem;"></i>
                <h3>Not logged in</h3>
                <p class="text-muted">Please log in to view your saved items.</p>
                <button class="btn mt-4" style="width:auto; padding: 10px 24px;" onclick="app.navigate('login-screen')">Log In</button>
            </div>`;
            return;
        }

        container.innerHTML = `<div style="grid-column: span 3; text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 2rem;"></i><p class="mt-4 text-muted">Loading your collection...</p></div>`;

        // Render from local storage immediately to resolve infinite spinner
        let localSaved = [];
        try {
            const stored = localStorage.getItem("fashionistSavedPosts_" + user.email);
            if (stored) localSaved = JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }

        const emailKey = user.email.replace(/\./g, '_');

        const renderSavedItems = (items) => {
            container.innerHTML = "";
            
            // Filter items by category
            const filteredItems = items.filter(post => {
                if (!this.currentSavedCategory || this.currentSavedCategory === 'all') return true;
                return post.category === this.currentSavedCategory;
            });

            if (filteredItems.length === 0) {
                container.innerHTML = `<div style="grid-column: span 3; text-align:center; padding: 60px 20px;">
                    <i class="fa-regular fa-bookmark text-muted mb-4" style="font-size: 3rem;"></i>
                    <h3>No saved items found</h3>
                    <p class="text-muted">Bookmark outfits, analysis results, and tips to see them here.</p>
                    <button class="btn mt-4" style="width:auto; padding: 10px 24px;" onclick="app.navigate('feed-screen')">Explore Pixies</button>
                </div>`;
                return;
            }

            // Render grid with unsave button on each card
            filteredItems.forEach(post => {
                const div = document.createElement("div");
                div.className = "saved-item fade-in";
                div.id = `saved-item-${post.id}`;
                div.innerHTML = `
                    <div style="position:relative; width:100%; aspect-ratio: 1/1; overflow:hidden; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <img src="${post.image}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1539109132335-34a91bf55a03?q=80&w=400&fit=crop'">
                        <span style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:#fff; padding:2px 8px; border-radius:6px; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px;">${post.category}</span>
                        <button class="saved-item-unsave-btn" title="Remove from Saved" onclick="app.unsavePost('${post.id}', '${emailKey}')">
                            <i class="fa-solid fa-bookmark"></i>
                        </button>
                    </div>
                    ${post.caption ? `<p style="font-size:0.75rem; margin-top:6px; color:var(--text-muted); padding: 0 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${post.caption}">${post.caption}</p>` : ''}
                `;
                container.appendChild(div);
            });
        };

        // Render local storage first
        renderSavedItems(localSaved);

        // Fetch from Firebase and sync
        firebase.database().ref("saved/" + emailKey).once("value", snapshot => {
            let firebaseSaved = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    firebaseSaved.push(child.val());
                });
            }

            // Merge local and firebase arrays
            const combined = [...localSaved];
            firebaseSaved.forEach(fbItem => {
                if (!combined.some(locItem => locItem.image === fbItem.image && locItem.caption === fbItem.caption)) {
                    combined.push(fbItem);
                }
            });

            this._writeSavedList(user, combined);
            renderSavedItems(combined);
        }, error => {
            console.error("Firebase read error, using local storage fallback only:", error);
            // Re-render local list to clear spinner anyway
            renderSavedItems(localSaved);
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
            const facePostData = { image: canvas.toDataURL(), category: "face", caption: `Face Analysis: ${analysis.shape} Shape` };
            this._initSaveButton(saveBtn, facePostData);

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
            const bodyPostData = { image: canvas.toDataURL(), category: "outfit", caption: `Body Analysis: ${analysis.shape} Silhouette` };
            this._initSaveButton(saveBtn, bodyPostData);

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
            const manualBodyPostData = { image: "https://images.unsplash.com/photo-1549439602-43bbcb625628?q=80&w=400&fit=crop", category: "outfit", caption: `Body Analysis: ${shape} Shape` };
            this._initSaveButton(saveBtn, manualBodyPostData);

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
            const eventPostData = {
                image: isHaveOutfit ? `data:${mimeType};base64,${imageBase64}` : "https://images.unsplash.com/photo-1539109132335-34a91bf55a03?q=80&w=400&fit=crop",
                category: "outfit",
                caption: `Event Styling for ${eventName}`
            };
            this._initSaveButton(saveBtn, eventPostData);

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
            let jsonString = text.substring(start, end + 1);
            // Fix trailing commas in arrays/objects for standard JSON.parse
            let cleanJson = jsonString.replace(/,\s*([\]}])/g, '$1');
            
            try {
                const parsed = JSON.parse(cleanJson);
                console.log("[Fashionist] Parsed JSON:", parsed);
                return parsed;
            } catch (e1) {
                console.warn("[Fashionist] Strict JSON.parse failed, attempting flexible evaluation...", e1.message);
                // Bulletproof fallback: handles unescaped quotes, newlines, and trailing commas automatically
                const parsed = new Function('return ' + jsonString)();
                console.log("[Fashionist] Flexibly evaluated JSON:", parsed);
                return parsed;
            }
        } catch (e) {
            console.error("[Fashionist] All JSON parsing failed:", e.message, "\nJSON attempted:", text.substring(start, end + 1).substring(0, 500));
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
                html += renderSection("Color Suggestions", d?.colorSuggestions);
                html += renderSection("Fabric Suggestions", d?.fabricSuggestions);
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

    // ============================================================
    //   SHARE CONTENT  (native share sheet / clipboard fallback)
    // ============================================================
    shareContent(title, text, url) {
        if (navigator.share) {
            navigator.share({ title, text, url }).catch(err => {
                if (err.name !== 'AbortError') {
                    this._copyToClipboard(url, 'Link copied to clipboard!');
                }
            });
        } else {
            this._copyToClipboard(url, `Profile link copied! Share it anywhere. 🔗`);
        }
    }

    _copyToClipboard(text, msg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => alert(msg));
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            try { document.execCommand('copy'); alert(msg); } catch(e) { alert('Could not copy link.'); }
            document.body.removeChild(ta);
        }
    }

    // ============================================================
    //   PROFILE PHOTO PICKER
    // ============================================================
    handleProfilePicChange(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            // Update UI immediately
            const pic = document.getElementById('profile-pic');
            const placeholder = document.getElementById('profile-pic-placeholder');
            if (pic) { pic.src = dataUrl; pic.style.display = 'block'; }
            if (placeholder) placeholder.style.display = 'none';

            // Persist in localStorage session
            const user = this.getLoggedInUser();
            if (user) {
                user.profilePic = dataUrl;
                localStorage.setItem("loggedInUser", JSON.stringify(user));
                this.updateProfileUI();
            }
            alert('✓ Profile photo updated!');
        };
        reader.readAsDataURL(file);
    }

    // ============================================================
    //   SEARCH OVERLAY
    // ============================================================
    executeSearch() {
        const input = document.getElementById("search-input-field");
        const suggestionsContainer = document.getElementById("search-suggestions-container");
        const hashtagsContainer = document.getElementById("trending-hashtags-container");
        if (!input || !suggestionsContainer) return;

        const q = input.value.trim().toLowerCase();

        const creators = [
            { name: "StylistSarah", handle: "@stylistsarah", email: "sarah@fashionist.com", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop", bio: "Fashion & Color Analysis ✨" },
            { name: "FashionistAI", handle: "@fashionistai", email: "ai@fashionist.com", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&fit=crop", bio: "AI Stylist & Trendsetter" },
            { name: "ZaraTrending", handle: "@zaratrending", email: "zara@fashionist.com", avatar: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&fit=crop", bio: "OOTD | Fall Lookbooks" },
            { name: "MakeupByMia", handle: "@makeupbymia", email: "mia@fashionist.com", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&fit=crop", bio: "Beauty & Glam 💄" },
        ];

        const hashtags = ["#Fashionist", "#OOTD", "#StyleTips", "#FashionAI", "#LookBook", "#ColorAnalysis", "#FaceAnalysis", "#BodyShape"];

        if (!q) {
            suggestionsContainer.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">Start typing to find creators...</p>';
            hashtagsContainer.innerHTML = hashtags.map(h => `<span class="pill" onclick="alert('Browsing posts tagged ${h}')">${h}</span>`).join('');
            return;
        }

        const filtered = creators.filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.bio.toLowerCase().includes(q));
        const filteredTags = hashtags.filter(h => h.toLowerCase().includes(q));

        suggestionsContainer.innerHTML = filtered.length > 0
            ? filtered.map(c => `<div style="display:flex; align-items:center; gap:12px; cursor:pointer; padding:10px; border-radius:12px; background:var(--bg-secondary);" onclick="app.closeSearchOverlay(); app.viewUserProfile('${c.email}')">
                    <div style="width:44px; height:44px; border-radius:50%; overflow:hidden; flex-shrink:0;"><img src="${c.avatar}" style="width:100%; height:100%; object-fit:cover;"></div>
                    <div>
                        <p style="margin:0; font-weight:600;">${c.name}</p>
                        <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">${c.handle} · ${c.bio}</p>
                    </div>
                    <i class="fa-solid fa-chevron-right text-muted" style="margin-left:auto;"></i>
                </div>`).join('')
            : '<p class="text-muted" style="font-size:0.9rem;">No creators found for "' + q + '"</p>';

        hashtagsContainer.innerHTML = filteredTags.length > 0
            ? filteredTags.map(h => `<span class="pill" onclick="alert('Browsing posts tagged ${h}')">${h}</span>`).join('')
            : '<p class="text-muted" style="font-size:0.85rem;">No hashtags found.</p>';
    }

    // ============================================================
    //   PROFILE TABS  (Posts / Pixels / Pixies)
    // ============================================================
    initProfileTabs() {
        const tabs = document.querySelectorAll('.ptab');
        tabs.forEach((tab, index) => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const types = ['all', 'photo', 'video'];
                this._profileTabFilter = types[index] || 'all';
                this.loadProfilePosts();
            };
        });
    }

    loadProfilePosts(email) {
        const container = document.getElementById("profile-posts-container");
        if (!container) return;

        const user = this.getLoggedInUser();
        const viewingEmail = email || this._currentViewingUserEmail || (user ? user.email : "");
        if (!viewingEmail) {
            container.innerHTML = '<p class="text-muted" style="grid-column:span 3; text-align:center; padding:20px;">Log in to see posts.</p>';
            return;
        }

        const isOwnProfile = user && (viewingEmail === user.email);

        if (isOwnProfile) {
            let posts = [];
            try {
                const stored = localStorage.getItem("fashionistPosts_" + viewingEmail);
                if (stored) posts = JSON.parse(stored);
            } catch (e) { console.error(e); }

            this.renderProfilePostsHtml(posts, viewingEmail);
        } else {
            const emailKey = viewingEmail.replace(/\./g, '_');
            container.innerHTML = `<div style="grid-column:span 3; text-align:center; padding:40px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 1.5rem;"></i></div>`;
            firebase.database().ref(`posts/${emailKey}`).once("value", snapshot => {
                const postsVal = snapshot.val() || {};
                const postsList = Object.keys(postsVal).map(id => ({
                    id,
                    ...postsVal[id],
                    media: postsVal[id].media || []
                })).sort((a, b) => b.timestamp - a.timestamp);
                
                this.renderProfilePostsHtml(postsList, viewingEmail);
            }).catch(err => {
                console.error("Failed to load other profile posts:", err);
                container.innerHTML = `<p class="text-danger text-center">Failed to load posts.</p>`;
            });
        }
    }

    renderProfilePostsHtml(posts, viewingEmail) {
        const container = document.getElementById("profile-posts-container");
        if (!container) return;
        
        const filter = this._profileTabFilter || 'all';
        const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);

        if (filtered.length === 0) {
            container.innerHTML = `<div style="grid-column:span 3; text-align:center; padding:40px 20px;">
                <i class="fa-regular fa-image text-muted mb-2" style="font-size:2.5rem;"></i>
                <p class="text-muted">No ${filter === 'all' ? 'posts' : filter === 'photo' ? 'photos (Pixels)' : 'videos (Pixies)'} yet.</p>
            </div>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(post => {
            const div = document.createElement('div');
            div.style.cssText = 'position:relative; width:100%; aspect-ratio:1/1; overflow:hidden; border-radius:8px; cursor:pointer;';
            div.innerHTML = post.type === 'video'
                ? `<video src="${post.media[0]}" style="width:100%;height:100%;object-fit:cover;" muted playsinline></video><i class="fa-solid fa-play" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:1.5rem;text-shadow:0 2px 4px rgba(0,0,0,0.5);"></i>`
                : `<img src="${post.media[0]}" style="width:100%;height:100%;object-fit:cover;">`;
            div.onclick = () => this.openPostDetail(post.id, viewingEmail);
            container.appendChild(div);
        });
    }

    // ============================================================
    //   MESSAGING  (Chats list + Thread)
    // ============================================================
    initChats() {
        this._chats = [
            { id: "sarah", name: "StylistSarah", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop", status: "Active now", lastMsg: "Your color season is definitely Spring ✨", time: "2m" },
            { id: "fashionistai", name: "AI Stylist Bot", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&fit=crop", status: "Active 5m ago", lastMsg: "Oval faces look great with...", time: "1h" },
            { id: "mia", name: "MakeupByMia", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&fit=crop", status: "Active yesterday", lastMsg: "Try a coral lip with your skin tone!", time: "1d" },
        ];
        this._chatHistory = {};
        this._chats.forEach(c => {
            this._chatHistory[c.id] = [
                { from: "them", text: c.lastMsg, time: c.time }
            ];
        });
    }

    renderChatsList() {
        const container = document.getElementById("chats-list");
        const searchInput = document.getElementById("chat-search-input");
        if (!container) return;

        const query = (searchInput?.value || "").toLowerCase().trim();
        const filtered = (this._chats || []).filter(c =>
            c.name.toLowerCase().includes(query) || c.lastMsg.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align:center; padding:40px 20px;">No chats found.</p>';
            return;
        }

        container.innerHTML = filtered.map(chat => `
            <div onclick="app.openChatThread('${chat.id}')" style="display:flex; align-items:center; gap:14px; padding:14px 16px; border-radius:16px; background:var(--bg-secondary); cursor:pointer; transition:background 0.2s;" 
                onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='var(--bg-secondary)'">
                <div style="position:relative; flex-shrink:0;">
                    <div style="width:48px; height:48px; border-radius:50%; overflow:hidden; border:2px solid var(--accent-rose-gold);">
                        <img src="${chat.avatar}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    ${chat.status.includes('Active now') ? '<div style="position:absolute;bottom:2px;right:2px;width:10px;height:10px;border-radius:50%;background:var(--accent-success);border:2px solid var(--bg-primary);"></div>' : ''}
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline;">
                        <p style="margin:0; font-weight:600; font-size:0.95rem;">${chat.name}</p>
                        <span style="font-size:0.75rem; color:var(--text-muted); flex-shrink:0;">${chat.time}</span>
                    </div>
                    <p style="margin:0; font-size:0.82rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chat.lastMsg}</p>
                </div>
            </div>
        `).join('');
    }

    openChatThread(chatId) {
        const chat = (this._chats || []).find(c => c.id === chatId);
        if (!chat) return;

        this._activeChatId = chatId;

        const nameEl = document.getElementById("chat-thread-name");
        const statusEl = document.getElementById("chat-thread-status");
        const avatarEl = document.getElementById("chat-thread-avatar");

        if (nameEl) nameEl.innerText = chat.name;
        if (statusEl) statusEl.innerText = chat.status;
        if (avatarEl) {
            const img = avatarEl.querySelector('img');
            if (img) img.src = chat.avatar;
        }

        this._renderChatMessages(chatId);
        this.navigate('chat-screen');
    }

    _renderChatMessages(chatId) {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        const history = (this._chatHistory && this._chatHistory[chatId]) || [];
        container.innerHTML = '';

        history.forEach(msg => {
            const isMe = msg.from === 'me';
            const div = document.createElement('div');
            div.style.cssText = `display:flex; justify-content:${isMe ? 'flex-end' : 'flex-start'}; align-items:flex-end; gap:8px;`;
            div.innerHTML = `
                <div style="max-width:75%; padding:10px 14px; border-radius:${isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}; 
                    background:${isMe ? 'var(--accent-rose-gold)' : 'var(--bg-secondary)'}; 
                    color:${isMe ? '#fff' : 'var(--text-primary)'}; font-size:0.9rem; line-height:1.4;">
                    ${msg.text}
                    <div style="font-size:0.7rem; opacity:0.7; margin-top:4px; text-align:${isMe ? 'right' : 'left'};">${msg.time}</div>
                </div>`;
            container.appendChild(div);
        });

        // Scroll to bottom
        setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }

    sendChatMessage() {
        const input = document.getElementById("chat-message-input");
        if (!input || !input.value.trim()) return;

        const chatId = this._activeChatId;
        if (!chatId) return;

        const now = new Date();
        const timeStr = now.getHours() + ":" + String(now.getMinutes()).padStart(2, '0');

        // Push user message
        if (!this._chatHistory[chatId]) this._chatHistory[chatId] = [];
        this._chatHistory[chatId].push({ from: 'me', text: input.value.trim(), time: timeStr });

        // Update last message in chats list
        const chat = (this._chats || []).find(c => c.id === chatId);
        if (chat) { chat.lastMsg = input.value.trim(); chat.time = 'now'; }

        input.value = '';
        this._renderChatMessages(chatId);

        // Simulate reply after 1.2s
        const replies = [
            "That's such a great style choice! 💅",
            "I totally agree! Let me suggest something...",
            "Absolutely! With your coloring, I'd recommend warm tones 🌅",
            "Yes! You'd look amazing in that. Go for it! ✨",
            "That's a perfect match for your aesthetic!",
            "Great question! Let me think... Try layering light neutrals first.",
            "Ohh I love that look! Pair it with gold accessories 🌟",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        setTimeout(() => {
            this._chatHistory[chatId].push({ from: 'them', text: randomReply, time: new Date().getHours() + ":" + String(new Date().getMinutes()).padStart(2, '0') });
            this._renderChatMessages(chatId);
        }, 1200 + Math.random() * 800);
    }

    // ============================================================
    //   CREATE POST MODAL
    // ============================================================
    handleCreatorMediaSelected(input) {
        if (!input.files || input.files.length === 0) return;

        this.closeCreatorSheet();
        const preview = document.getElementById("create-post-preview");
        const modal = document.getElementById("create-post-modal");

        if (!preview || !modal) return;

        preview.innerHTML = '<div style="padding:8px; color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading preview...</div>';

        const files = Array.from(input.files).slice(0, 10); // max 10 media items
        const readers = files.map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ url: e.target.result, type: file.type.startsWith('video') ? 'video' : 'photo' });
            reader.readAsDataURL(file);
        }));

        Promise.all(readers).then(results => {
            this._pendingPostMedia = results;
            preview.innerHTML = results.map((r, i) =>
                r.type === 'video'
                    ? `<video src="${r.url}" style="height:120px; border-radius:8px; object-fit:cover; flex-shrink:0;" controls muted></video>`
                    : `<img src="${r.url}" style="height:120px; border-radius:8px; object-fit:cover; flex-shrink:0;">`
            ).join('');

            // Auto-select type based on first file
            const typeSelect = document.getElementById("create-post-type");
            if (typeSelect && results[0]) {
                typeSelect.value = results[0].type === 'video' ? 'video' : 'photo';
            }

            modal.classList.remove('hidden');
            modal.classList.add('slide-up-active');
        });
    }

    closeCreatePostModal() {
        const modal = document.getElementById("create-post-modal");
        if (modal) {
            modal.classList.remove('slide-up-active');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
        this._pendingPostMedia = null;
        const caption = document.getElementById("create-post-caption");
        if (caption) caption.value = '';
    }

    submitNewPost() {
        const user = this.getLoggedInUser();
        if (!user) {
            alert("Please log in to post.");
            return;
        }

        const mediaItems = this._pendingPostMedia;
        if (!mediaItems || mediaItems.length === 0) {
            alert("No media selected.");
            return;
        }

        const caption = document.getElementById("create-post-caption")?.value.trim() || '';
        const type = document.getElementById("create-post-type")?.value || 'photo';
        const id = Date.now();

        const post = {
            id,
            media: mediaItems.map(m => m.url),
            caption,
            type,
            timestamp: id
        };

        // Save to local storage
        let posts = [];
        try {
            const stored = localStorage.getItem("fashionistPosts_" + user.email);
            if (stored) posts = JSON.parse(stored);
        } catch(e) {}
        posts.unshift(post);
        localStorage.setItem("fashionistPosts_" + user.email, JSON.stringify(posts));

        // Firebase background sync (only store caption + type + timestamp, not base64 media)
        firebase.database().ref("posts/" + user.email.replace(/\./g, '_') + "/" + id).set({
            caption, type, timestamp: id
        }).catch(err => console.warn("Firebase post sync failed:", err));

        this.closeCreatePostModal();
        alert("✓ Post published successfully!");

        // Refresh profile posts if on profile screen
        if (this.currentScreen === 'profile-screen') {
            this.loadProfilePosts();
        }
    }

    // ============================================================
    //   FEED LIKE  (with persistence)
    // ============================================================
    toggleFeedLike(iconEl, countEl) {
        const isLiked = iconEl.classList.contains('fa-solid');
        let count = parseInt(countEl.innerText.replace(/,/g, ''), 10) || 12450;

        if (isLiked) {
            iconEl.classList.remove('fa-solid', 'heart-active');
            iconEl.classList.add('fa-regular');
            count = Math.max(0, count - 1);
        } else {
            iconEl.classList.remove('fa-regular');
            iconEl.classList.add('fa-solid', 'heart-active');
            count += 1;
        }

        countEl.innerText = count.toLocaleString();
        localStorage.setItem("feed_is_liked", String(!isLiked));
        localStorage.setItem("feed_likes_count", String(count));
    }

    // ============================================================
    //   NEW SOCIAL NETWORK LOGIC (FEED, LIKES, COMMENTS, PROFILE)
    // ============================================================
    loadFeed() {
        const container = document.getElementById("feed-posts-scroll-container");
        if (!container) return;
        
        container.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 2rem;"></i><p class="mt-4 text-muted">Curating your fashion feed...</p></div>`;
        
        const user = this.getLoggedInUser();
        const myEmailKey = user ? user.email.replace(/\./g, '_') : "";
        
        Promise.all([
            firebase.database().ref("users").once("value"),
            firebase.database().ref("posts").once("value"),
            firebase.database().ref("likes").once("value"),
            firebase.database().ref("comments").once("value")
        ]).then(([usersSnap, postsSnap, likesSnap, commentsSnap]) => {
            const users = usersSnap.val() || {};
            const allPostsData = postsSnap.val() || {};
            const allLikes = likesSnap.val() || {};
            const allComments = commentsSnap.val() || {};
            
            this._usersCache = users;
            
            let postsList = [];
            
            for (const emailKey in allPostsData) {
                const userPosts = allPostsData[emailKey];
                for (const postId in userPosts) {
                    const post = userPosts[postId];
                    post.userEmailKey = emailKey;
                    
                    const creator = users[emailKey] || { name: "Anonymous", username: "user", profilePic: "" };
                    post.creatorName = creator.name || creator.fullName || "Anonymous";
                    post.creatorUsername = creator.username || "user";
                    post.creatorAvatar = creator.profilePic || "";
                    post.creatorEmail = creator.email || emailKey.replace(/_/g, '.');
                    
                    const likes = allLikes[post.id] || {};
                    post.isLiked = !!likes[myEmailKey];
                    post.likesCount = Object.keys(likes).length;
                    
                    const comments = allComments[post.id] || {};
                    post.commentsCount = Object.keys(comments).length;
                    
                    postsList.push(post);
                }
            }
            
            postsList.sort((a, b) => b.timestamp - a.timestamp);
            
            if (postsList.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding: 60px 20px;">
                        <i class="fa-regular fa-image text-muted mb-4" style="font-size: 3rem;"></i>
                        <h3>No posts in feed yet</h3>
                        <p class="text-muted">Start the conversation by publishing your first fashion look!</p>
                        <button class="btn mt-4" style="width:auto; padding: 10px 24px;" onclick="app.openCreatorSheet()">Create Post</button>
                    </div>`;
                return;
            }
            
            container.innerHTML = "";
            postsList.forEach(post => {
                const postCard = document.createElement("div");
                postCard.className = "card";
                postCard.style.padding = "0";
                postCard.style.marginBottom = "24px";
                postCard.style.overflow = "hidden";
                postCard.style.background = "var(--bg-secondary)";
                postCard.style.borderColor = "var(--border-light)";
                
                const isVideo = post.type === 'video';
                let mediaUrl = post.media && post.media[0] ? post.media[0] : "";
                
                // Fix: Load media from localStorage for the current user since Firebase sync doesn't store base64 media
                if (!mediaUrl && post.creatorEmail === user.email) {
                    try {
                        const stored = localStorage.getItem("fashionistPosts_" + user.email);
                        if (stored) {
                            const localPosts = JSON.parse(stored);
                            const localPost = localPosts.find(p => String(p.id) === String(post.id));
                            if (localPost && localPost.media && localPost.media[0]) {
                                mediaUrl = localPost.media[0];
                            }
                        }
                    } catch(e) {}
                }
                
                postCard.innerHTML = `
                    <!-- Post Header -->
                    <div style="display:flex; align-items:center; gap:12px; padding:12px 16px;">
                        <div class="avatar" style="width:40px; height:40px; overflow:hidden; border-radius:50%; cursor:pointer;" onclick="app.viewUserProfile('${post.creatorEmail}')">
                            ${post.creatorAvatar ? `<img src="${post.creatorAvatar}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-user"></i>`}
                        </div>
                        <div>
                            <h4 style="margin:0; font-weight:600; cursor:pointer;" onclick="app.viewUserProfile('${post.creatorEmail}')">${post.creatorName}</h4>
                            <p style="margin:0; font-size:0.75rem; color:var(--text-muted); cursor:pointer;" onclick="app.viewUserProfile('${post.creatorEmail}')">@${post.creatorUsername}</p>
                        </div>
                        <span style="margin-left:auto; font-size:0.75rem; color:var(--text-muted);">${app.formatPostDate(post.timestamp)}</span>
                    </div>
                    
                    <!-- Post Media -->
                    <div style="position:relative; width:100%; aspect-ratio: 4/5; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="app.openPostDetail('${post.id}', '${post.creatorEmail}')">
                        ${isVideo 
                            ? `<video class="feed-video" src="${mediaUrl}" style="width:100%; height:100%; object-fit:cover;" loop muted playsinline></video>
                               <i class="fa-solid fa-play" style="position:absolute; color:#fff; font-size:2.5rem; opacity:0.7; pointer-events:none; transition: opacity 0.2s;"></i>`
                            : `<img src="${mediaUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&fit=crop'">`
                        }
                    </div>
                    
                    <!-- Action Bar -->
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; font-size:1.3rem;">
                        <div style="display:flex; gap:16px; align-items:center;">
                            <i class="like-btn-${post.id} ${post.isLiked ? 'fa-solid fa-heart heart-active' : 'fa-regular fa-heart'}" 
                               style="cursor:pointer;" 
                               onclick="app.togglePostLike('${post.id}', '${post.creatorEmail}', this, this.nextElementSibling); event.stopPropagation();"></i>
                            <span class="like-count-${post.id}" style="font-size:0.85rem; font-weight:600; margin-left:-8px;">${post.likesCount}</span>
                            
                            <i class="fa-regular fa-comment" style="cursor:pointer;" onclick="app.openCommentSheetForPost('${post.id}', '${post.creatorEmail}'); event.stopPropagation();"></i>
                            <span style="font-size:0.85rem; font-weight:600; margin-left:-8px;">${post.commentsCount}</span>
                            
                            <i class="fa-solid fa-share" style="cursor:pointer; font-size:1.1rem;" onclick="app.shareContent('Post by @${post.creatorUsername}', '${post.caption}', window.location.href); event.stopPropagation();"></i>
                        </div>
                        <div>
                            <i class="${app.isPostSaved({image: mediaUrl, caption: post.caption || ''}) ? 'fa-solid fa-bookmark text-rose' : 'fa-regular fa-bookmark'}" 
                               style="cursor:pointer;" 
                               onclick="app.toggleSave({image: '${mediaUrl}', caption: '${(post.caption || '').replace(/'/g, "\\'")}', category: 'outfit'}, this); event.stopPropagation();"></i>
                        </div>
                    </div>
                    
                    <!-- Caption -->
                    <div style="padding:0 16px 16px 16px;">
                        <p style="margin:0; font-size:0.9rem; line-height:1.4;"><strong style="cursor:pointer;" onclick="app.viewUserProfile('${post.creatorEmail}')">@${post.creatorUsername}</strong> ${post.caption || ''}</p>
                    </div>
                `;
                container.appendChild(postCard);
            });
            
            app.setupFeedVideoObserver();
            
            if (this._feedScrollPosition) {
                container.scrollTop = this._feedScrollPosition;
            }
        }).catch(err => {
            console.error("Failed to load feed:", err);
            container.innerHTML = `<p class="text-danger text-center mt-4">Failed to load feed. Tap to retry.</p>`;
        });
    }

    setupFeedVideoObserver() {
        const videos = document.querySelectorAll('.feed-video');
        if (videos.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                const playIcon = video.nextElementSibling;
                if (entry.isIntersecting) {
                    video.play().then(() => {
                        if (playIcon) playIcon.style.opacity = '0';
                    }).catch(() => {});
                } else {
                    video.pause();
                    if (playIcon) playIcon.style.opacity = '0.7';
                }
            });
        }, { threshold: 0.6 });
        
        videos.forEach(v => observer.observe(v));
    }

    formatPostDate(timestamp) {
        const diff = Date.now() - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 7) {
            const date = new Date(timestamp);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } else if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }

    togglePostLike(postId, postOwnerEmail, likeIconEl, countEl) {
        const user = this.getLoggedInUser();
        if (!user) {
            alert("Please log in to like posts.");
            return;
        }
        
        const myEmailKey = user.email.replace(/\./g, '_');
        const ownerEmailKey = postOwnerEmail.replace(/\./g, '_');
        const likeRef = firebase.database().ref(`likes/${postId}/${myEmailKey}`);
        
        const isLiked = likeIconEl.classList.contains('fa-solid');
        let count = parseInt(countEl.innerText.replace(/,/g, ''), 10) || 0;
        
        const newIsLiked = !isLiked;
        if (!newIsLiked) {
            count = Math.max(0, count - 1);
        } else {
            count += 1;
        }
        
        // Globally update all like buttons for this post in the DOM
        document.querySelectorAll(`.like-btn-${postId}`).forEach(icon => {
            if (newIsLiked) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid', 'heart-active');
            } else {
                icon.classList.remove('fa-solid', 'heart-active');
                icon.classList.add('fa-regular');
            }
        });
        
        document.querySelectorAll(`.like-count-${postId}`).forEach(span => {
            span.innerText = count.toLocaleString();
        });
        
        if (!newIsLiked) {
            likeRef.remove().catch(err => {
                console.error("Unlike failed, reverting:", err);
                document.querySelectorAll(`.like-btn-${postId}`).forEach(icon => {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid', 'heart-active');
                });
                document.querySelectorAll(`.like-count-${postId}`).forEach(span => {
                    span.innerText = (count + 1).toLocaleString();
                });
            });
        } else {
            likeRef.set(true).catch(err => {
                console.error("Like failed, reverting:", err);
                document.querySelectorAll(`.like-btn-${postId}`).forEach(icon => {
                    icon.classList.remove('fa-solid', 'heart-active');
                    icon.classList.add('fa-regular');
                });
                document.querySelectorAll(`.like-count-${postId}`).forEach(span => {
                    span.innerText = (count - 1).toLocaleString();
                });
            });
        }
    }

    openPostDetail(postId, userEmail) {
        if (this.currentScreen === 'feed-screen') {
            const container = document.getElementById("feed-posts-scroll-container");
            if (container) {
                this._feedScrollPosition = container.scrollTop;
            }
        }
        this.navigate('post-detail-screen');
        const container = document.getElementById("post-detail-container");
        if (!container) return;
        
        container.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 2rem;"></i><p class="mt-4 text-muted">Loading post details...</p></div>`;
        
        const user = this.getLoggedInUser();
        const myEmailKey = user ? user.email.replace(/\./g, '_') : "";
        const emailKey = userEmail.replace(/\./g, '_');
        
        const postRef = firebase.database().ref(`posts/${emailKey}/${postId}`).once("value").catch(err => {
            console.warn("Firebase post fetch failed, using local/null fallback:", err);
            return null;
        });
        const creatorRef = firebase.database().ref(`users/${emailKey}`).once("value").catch(err => {
            console.warn("Firebase user fetch failed:", err);
            return null;
        });
        const likesRef = firebase.database().ref(`likes/${postId}`).once("value").catch(err => {
            console.warn("Firebase likes fetch failed:", err);
            return null;
        });
        const commentsRef = firebase.database().ref(`comments/${postId}`).once("value").catch(err => {
            console.warn("Firebase comments fetch failed:", err);
            return null;
        });

        Promise.all([postRef, creatorRef, likesRef, commentsRef])
            .then(([postSnap, creatorSnap, likesSnap, commentsSnap]) => {
                const postVal = postSnap ? postSnap.val() : null;
                const creatorVal = creatorSnap ? creatorSnap.val() : null;
                const likes = likesSnap ? (likesSnap.val() || {}) : {};
                const comments = commentsSnap ? (commentsSnap.val() || {}) : {};
                
                // If post is not in Firebase (or failed to fetch), try to construct it from localStorage or cache
                let post = postVal;
                if (!post) {
                    try {
                        const stored = localStorage.getItem("fashionistPosts_" + userEmail);
                        if (stored) {
                            const localPosts = JSON.parse(stored);
                            const localPost = localPosts.find(p => String(p.id) === String(postId));
                            if (localPost) {
                                post = {
                                    id: localPost.id,
                                    caption: localPost.caption || "",
                                    type: localPost.type || "photo",
                                    timestamp: localPost.timestamp || localPost.id,
                                    media: localPost.media || []
                                };
                            }
                        }
                    } catch(e) { console.error("Error loading fallback local post:", e); }
                }
                
                if (!post) {
                    container.innerHTML = `<p class="text-muted text-center mt-8">Post not found.</p>`;
                    return;
                }
                
                let creator = creatorVal || { name: "Anonymous", username: "user", profilePic: "" };
                if (user && userEmail === user.email) {
                    creator = {
                        name: user.name || user.fullName || "Me",
                        username: user.username || "me",
                        profilePic: user.profilePic || ""
                    };
                }
            
            const isLiked = !!likes[myEmailKey];
            const likesCount = Object.keys(likes).length;
            const commentsList = Object.values(comments).sort((a,b) => a.timestamp - b.timestamp);
            const commentsCount = commentsList.length;
            const isVideo = post.type === 'video';
            let mediaUrl = post.media && post.media[0] ? post.media[0] : "";
            
            // Fix: Load media from localStorage for the current user since Firebase sync doesn't store base64 media
            if (!mediaUrl && emailKey === myEmailKey && user) {
                try {
                    const stored = localStorage.getItem("fashionistPosts_" + user.email);
                    if (stored) {
                        const localPosts = JSON.parse(stored);
                        const localPost = localPosts.find(p => String(p.id) === String(postId));
                        if (localPost && localPost.media && localPost.media[0]) {
                            mediaUrl = localPost.media[0];
                        }
                    }
                } catch(e) { console.error("Error loading local post media:", e); }
            }
            
            container.innerHTML = `
                <div class="card" style="padding:0; overflow:hidden; background:var(--bg-secondary); border-color:var(--border-light);">
                    <!-- Post Header -->
                    <div style="display:flex; align-items:center; gap:12px; padding:12px 16px;">
                        <div class="avatar" style="width:40px; height:40px; overflow:hidden; border-radius:50%; cursor:pointer;" onclick="app.viewUserProfile('${userEmail}')">
                            ${creator.profilePic ? `<img src="${creator.profilePic}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-user"></i>`}
                        </div>
                        <div>
                            <h4 style="margin:0; font-weight:600; cursor:pointer;" onclick="app.viewUserProfile('${userEmail}')">${creator.name || creator.fullName}</h4>
                            <p style="margin:0; font-size:0.75rem; color:var(--text-muted); cursor:pointer;" onclick="app.viewUserProfile('${userEmail}')">@${creator.username}</p>
                        </div>
                        <span style="margin-left:auto; font-size:0.75rem; color:var(--text-muted);">${app.formatPostDate(post.timestamp)}</span>
                    </div>
                    
                    <!-- Post Media -->
                    <div style="position:relative; width:100%; aspect-ratio: 4/5; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        ${isVideo 
                            ? `<video class="detail-video" src="${mediaUrl}" style="width:100%; height:100%; object-fit:cover;" autoplay loop muted playsinline></video>`
                            : `<img src="${mediaUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&fit=crop'">`
                        }
                    </div>
                    
                    <!-- Action Bar -->
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; font-size:1.3rem;">
                        <div style="display:flex; gap:16px; align-items:center;">
                            <i class="like-btn-${postId} ${isLiked ? 'fa-solid fa-heart heart-active' : 'fa-regular fa-heart'}" 
                               style="cursor:pointer;" 
                               onclick="app.togglePostLike('${postId}', '${userEmail}', this, this.nextElementSibling)"></i>
                            <span class="like-count-${postId}" style="font-size:0.85rem; font-weight:600; margin-left:-8px;">${likesCount}</span>
                            
                            <i class="fa-regular fa-comment" style="cursor:pointer;" onclick="document.getElementById('post-detail-new-cmt').focus()"></i>
                            <span style="font-size:0.85rem; font-weight:600; margin-left:-8px;">${commentsCount}</span>
                            
                            <i class="fa-solid fa-share" style="cursor:pointer; font-size:1.1rem;" onclick="app.shareContent('Post by @${creator.username}', '${post.caption}', window.location.href)"></i>
                        </div>
                        <div>
                            <i class="${app.isPostSaved({image: mediaUrl, caption: post.caption || ''}) ? 'fa-solid fa-bookmark text-rose' : 'fa-regular fa-bookmark'}" 
                               style="cursor:pointer;" 
                               onclick="app.toggleSave({image: '${mediaUrl}', caption: '${(post.caption || '').replace(/'/g, "\\'")}', category: 'outfit'}, this)"></i>
                        </div>
                    </div>
                    
                    <!-- Caption -->
                    <div style="padding:0 16px 16px 16px; border-bottom: 1px solid var(--border-light);">
                        <p style="margin:0; font-size:0.9rem; line-height:1.4;"><strong style="cursor:pointer;" onclick="app.viewUserProfile('${userEmail}')">@${creator.username}</strong> ${post.caption || ''}</p>
                    </div>
                    
                    <!-- Comments Header -->
                    <div style="padding:16px 16px 8px 16px;">
                        <h4 style="margin:0; font-size:0.95rem; font-weight:600;">Comments (${commentsCount})</h4>
                    </div>
                    
                    <!-- Comments List -->
                    <div id="post-detail-comments-list" style="padding:0 16px 16px 16px; display:flex; flex-direction:column; gap:12px; max-height: 250px; overflow-y: auto;">
                        ${commentsCount === 0 
                            ? `<p class="text-muted text-center" style="font-size:0.85rem; padding: 20px 0;">No comments yet. Join the conversation!</p>`
                            : commentsList.map(cmt => `
                                <div style="display:flex; gap:10px; align-items:flex-start;">
                                    <div style="width:28px; height:28px; border-radius:50%; overflow:hidden; background:#ffdf73; color:#120d0f; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.75rem;">
                                        <i class="fa-solid fa-user"></i>
                                    </div>
                                    <div style="flex:1;">
                                        <p style="margin:0; font-size:0.85rem;">
                                            <strong style="cursor:pointer;" onclick="app.viewUserProfile('${cmt.userEmail}')">@${cmt.username}</strong>
                                            <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px;">${app.formatPostDate(cmt.timestamp)}</span>
                                        </p>
                                        <p style="margin:4px 0 0 0; font-size:0.85rem; color:var(--text-primary);">${cmt.text}</p>
                                    </div>
                                </div>
                              `).join('')
                        }
                    </div>
                    
                    <!-- Add Comment Section -->
                    <div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-top:1px solid var(--border-light); background:var(--bg-secondary);">
                        <input type="text" id="post-detail-new-cmt" style="flex:1; padding:8px 12px; border-radius:20px; border:1px solid var(--border-light); background:var(--bg-primary); color:var(--text-primary); font-size:0.85rem;" placeholder="Add a comment...">
                        <button class="btn" style="width:auto; padding:6px 16px; font-size:0.8rem; border-radius:20px;" onclick="app.submitPostDetailComment('${postId}', '${userEmail}')">Post</button>
                    </div>
                </div>
            `;
        }).catch(err => {
            console.error("Failed to load post details:", err);
            container.innerHTML = `<p class="text-danger text-center">Failed to load post details.</p>`;
        });
    }

    submitPostDetailComment(postId, postOwnerEmail) {
        const user = this.getLoggedInUser();
        if (!user) {
            alert("Please log in to comment.");
            return;
        }
        
        const input = document.getElementById("post-detail-new-cmt");
        const text = input ? input.value.trim() : "";
        if (!text) return;
        
        const commentId = Date.now();
        const username = user.username || user.name || user.email.split('@')[0];
        
        const commentData = {
            id: commentId,
            username: username,
            userEmail: user.email,
            text: text,
            timestamp: commentId
        };
        
        firebase.database().ref(`comments/${postId}/${commentId}`).set(commentData)
            .then(() => {
                input.value = "";
                this.openPostDetail(postId, postOwnerEmail);
            })
            .catch(err => {
                console.error("Failed to post comment:", err);
                alert("Failed to submit comment. Please try again.");
            });
    }

    viewUserProfile(email) {
        this._currentViewingUserEmail = email;
        this.navigate('profile-screen');
    }

    navigateToMyProfile() {
        this._currentViewingUserEmail = null;
        this.navigate('profile-screen');
    }

    updateProfileHeader(email) {
        const user = this.getLoggedInUser();
        const viewingEmail = email || (user ? user.email : "");
        if (!viewingEmail) return;
        
        const myEmailKey = user ? user.email.replace(/\./g, '_') : "";
        const emailKey = viewingEmail.replace(/\./g, '_');
        
        Promise.all([
            firebase.database().ref(`users/${emailKey}`).once("value"),
            firebase.database().ref("follows").once("value"),
            firebase.database().ref(`posts/${emailKey}`).once("value")
        ]).then(([userSnap, followsSnap, postsSnap]) => {
            const userData = userSnap.val() || {};
            const follows = followsSnap.val() || {};
            const posts = postsSnap.val() || {};
            
            const name = userData.name || userData.fullName || "Anonymous";
            const username = userData.username || "user";
            const bio = userData.bio || "No bio added yet.";
            const profilePic = userData.profilePic || "";
            
            const displayNameEl = document.getElementById("display-name");
            const displayBioEl = document.getElementById("display-bio");
            const displayUserEl = document.getElementById("display-username");
            
            if (displayNameEl) displayNameEl.innerText = name;
            if (displayBioEl) displayBioEl.innerText = bio;
            if (displayUserEl) displayUserEl.innerText = "@" + username;
            
            const avatarContainer = document.querySelector("#profile-screen .avatar");
            if (avatarContainer) {
                if (profilePic) {
                    avatarContainer.innerHTML = `<img src="${profilePic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                } else {
                    avatarContainer.innerHTML = `<i class="fa-solid fa-user"></i>`;
                }
            }
            
            let followersList = [];
            let followingList = [];
            
            for (const follower in follows) {
                for (const following in follows[follower]) {
                    if (follows[follower][following]) {
                        if (follower === emailKey) {
                            followingList.push(following);
                        }
                        if (following === emailKey) {
                            followersList.push(follower);
                        }
                    }
                }
            }
            
            const postsCount = Object.keys(posts).length;
            const followersCount = followersList.length;
            const followingCount = followingList.length;
            
            const postsCountEl = document.getElementById('profile-posts-count');
            const followerEl = document.getElementById('follower-count');
            const followingEl = document.getElementById('following-count');
            
            if (postsCountEl) postsCountEl.innerText = postsCount;
            if (followerEl) followerEl.innerText = followersCount;
            if (followingEl) followingEl.innerText = followingCount;
            
            if (viewingEmail === (user ? user.email : "")) {
                this.data.followers = followersCount;
            }
            
            const actionButtonsContainer = document.getElementById("profile-action-buttons");
            if (actionButtonsContainer) {
                if (viewingEmail === (user ? user.email : "")) {
                    actionButtonsContainer.innerHTML = `
                        <button class="btn-secondary" style="flex:1; padding:8px; border-radius:8px; font-weight:600;" onclick="app.navigate('edit-profile-screen')">Edit Profile</button>
                        <button class="btn-secondary" style="flex:1; padding:8px; border-radius:8px; font-weight:600;" onclick="app.shareContent('Fashionist Profile', 'Check out my fashion profile on Fashionist!', window.location.href)">Share Profile</button>
                    `;
                } else {
                    const isFollowing = follows[myEmailKey] && follows[myEmailKey][emailKey];
                    actionButtonsContainer.innerHTML = `
                        <button class="btn ${isFollowing ? 'btn-secondary' : ''}" style="flex:1; padding:8px; border-radius:8px; font-weight:600; background: ${isFollowing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #d4af37, #b76e79)'}; color: ${isFollowing ? 'var(--text-primary)' : '#fff'}; border: none;" onclick="app.toggleFollowUser('${viewingEmail}', this)">
                            ${isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button class="btn-secondary" style="flex:1; padding:8px; border-radius:8px; font-weight:600;" onclick="app.startDirectChat('${viewingEmail}')">Message</button>
                    `;
                }
            }
        });
    }

    toggleFollowUser(targetEmail, btnEl) {
        const user = this.getLoggedInUser();
        if (!user) {
            alert("Please log in to follow creators.");
            return;
        }
        
        const myEmailKey = user.email.replace(/\./g, '_');
        const targetEmailKey = targetEmail.replace(/\./g, '_');
        const followRef = firebase.database().ref(`follows/${myEmailKey}/${targetEmailKey}`);
        
        const isFollowing = btnEl.innerText.trim() === 'Following';
        
        if (isFollowing) {
            followRef.remove().then(() => {
                btnEl.innerText = 'Follow';
                btnEl.style.background = 'linear-gradient(135deg, #d4af37, #b76e79)';
                btnEl.style.color = '#fff';
                this.updateProfileHeader(targetEmail);
            }).catch(err => console.error("Unfollow failed:", err));
        } else {
            followRef.set(true).then(() => {
                btnEl.innerText = 'Following';
                btnEl.style.background = 'var(--bg-tertiary)';
                btnEl.style.color = 'var(--text-primary)';
                this.updateProfileHeader(targetEmail);
            }).catch(err => console.error("Follow failed:", err));
        }
    }

    openFollowersPage(email) {
        const viewingEmail = email || this._currentViewingUserEmail || (this.getLoggedInUser() ? this.getLoggedInUser().email : "");
        if (!viewingEmail) return;
        
        this._currentViewingUserEmail = viewingEmail;
        this.navigate('followers-screen');
        
        const container = document.getElementById("followers-list-container");
        if (!container) return;
        
        container.innerHTML = `<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 1.5rem;"></i></div>`;
        
        const emailKey = viewingEmail.replace(/\./g, '_');
        
        firebase.database().ref("follows").once("value", snapshot => {
            // Also fetch users to guarantee _usersCache is populated (fixes infinite loading)
            firebase.database().ref("users").once("value", usersSnapshot => {
                this._usersCache = usersSnapshot.val() || {};
                
                const follows = snapshot.val() || {};
                let followersList = [];
                
                for (const follower in follows) {
                    if (follows[follower][emailKey]) {
                        followersList.push(follower);
                    }
                }
            
            if (followersList.length === 0) {
                container.innerHTML = `<p class="text-muted text-center mt-8">No followers yet.</p>`;
                return;
            }
            
            container.innerHTML = "";
            followersList.forEach(followerKey => {
                const creator = this._usersCache[followerKey] || { name: "Anonymous", username: "user", profilePic: "" };
                const followerEmail = creator.email || followerKey.replace(/_/g, '.');
                
                const item = document.createElement("div");
                item.style.cssText = "display:flex; align-items:center; gap:12px; padding:10px; border-radius:12px; background:var(--bg-secondary); cursor:pointer;";
                item.onclick = () => app.viewUserProfile(followerEmail);
                item.innerHTML = `
                    <div style="width:44px; height:44px; border-radius:50%; overflow:hidden; flex-shrink:0;">
                        ${creator.profilePic ? `<img src="${creator.profilePic}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-user" style="font-size:1.5rem;"></i>`}
                    </div>
                    <div>
                        <p style="margin:0; font-weight:600;">${creator.name || creator.fullName}</p>
                        <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">@${creator.username}</p>
                    </div>
                    <i class="fa-solid fa-chevron-right text-muted" style="margin-left:auto;"></i>
                `;
                container.appendChild(item);
            });
            });
        });
    }

    openFollowingPage(email) {
        const viewingEmail = email || this._currentViewingUserEmail || (this.getLoggedInUser() ? this.getLoggedInUser().email : "");
        if (!viewingEmail) return;
        
        this._currentViewingUserEmail = viewingEmail;
        this.navigate('following-screen');
        
        const container = document.getElementById("following-list-container");
        if (!container) return;
        
        container.innerHTML = `<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 1.5rem;"></i></div>`;
        
        const emailKey = viewingEmail.replace(/\./g, '_');
        
        firebase.database().ref("follows").once("value", snapshot => {
            firebase.database().ref("users").once("value", usersSnapshot => {
                this._usersCache = usersSnapshot.val() || {};
                
                const follows = snapshot.val() || {};
                let followingList = [];
                
                for (const following in follows[emailKey]) {
                    if (follows[emailKey][following]) {
                        followingList.push(following);
                    }
                }
            
            if (followingList.length === 0) {
                container.innerHTML = `<p class="text-muted text-center mt-8">Not following anyone yet.</p>`;
                return;
            }
            
            container.innerHTML = "";
            followingList.forEach(followingKey => {
                const creator = this._usersCache[followingKey] || { name: "Anonymous", username: "user", profilePic: "" };
                const followingEmail = creator.email || followingKey.replace(/_/g, '.');
                
                const item = document.createElement("div");
                item.style.cssText = "display:flex; align-items:center; gap:12px; padding:10px; border-radius:12px; background:var(--bg-secondary); cursor:pointer;";
                item.onclick = () => app.viewUserProfile(followingEmail);
                item.innerHTML = `
                    <div style="width:44px; height:44px; border-radius:50%; overflow:hidden; flex-shrink:0;">
                        ${creator.profilePic ? `<img src="${creator.profilePic}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-user" style="font-size:1.5rem;"></i>`}
                    </div>
                    <div>
                        <p style="margin:0; font-weight:600;">${creator.name || creator.fullName}</p>
                        <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">@${creator.username}</p>
                    </div>
                    <i class="fa-solid fa-chevron-right text-muted" style="margin-left:auto;"></i>
                `;
                container.appendChild(item);
            });
            });
        });
    }

    openCommentSheetForPost(postId, postOwnerEmail) {
        this._activeCommentPostId = postId;
        this._activeCommentPostOwnerEmail = postOwnerEmail;
        this.openCommentSheet();
        
        const list = document.getElementById("comment-list");
        if (!list) return;
        
        list.innerHTML = `<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-circle-notch fa-spin text-rose" style="font-size: 1.5rem;"></i></div>`;
        
        firebase.database().ref(`comments/${postId}`).on("value", snapshot => {
            const commentsVal = snapshot.val() || {};
            const listArr = Object.values(commentsVal).sort((a,b) => a.timestamp - b.timestamp);
            
            const header = document.querySelector("#comment-sheet h3");
            if (header) header.innerText = `Comments (${listArr.length})`;
            
            if (listArr.length === 0) {
                list.innerHTML = `<p class="text-center text-muted mt-8">No comments yet. Be the first to join the conversation!</p>`;
                return;
            }
            
            list.innerHTML = listArr.map(cmt => `
                <div class="comment-item fade-in" style="display:flex; gap:10px; align-items:flex-start; margin-bottom:12px;">
                    <div class="comment-avatar" style="width:32px; height:32px; border-radius:50%; overflow:hidden; background:#ffdf73; color:#120d0f; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.8rem;">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div style="flex:1;">
                        <p style="margin:0; font-size:0.85rem;">
                            <strong style="cursor:pointer;" onclick="app.closeCommentSheet(); app.viewUserProfile('${cmt.userEmail}')">@${cmt.username}</strong>
                            <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px;">${app.formatPostDate(cmt.timestamp)}</span>
                        </p>
                        <p style="margin:4px 0 0 0; font-size:0.85rem; color:var(--text-primary);">${cmt.text}</p>
                    </div>
                </div>
            `).join('');
        });
    }

    postComment() {
        const input = document.getElementById('new-cmt');
        const text = input ? input.value.trim() : "";
        if (!text || !this._activeCommentPostId) return;
        
        const user = this.getLoggedInUser();
        if (!user) {
            alert("Please log in to comment.");
            return;
        }
        
        const commentId = Date.now();
        const username = user.username || user.name || user.email.split('@')[0];
        
        const commentData = {
            id: commentId,
            username: username,
            userEmail: user.email,
            text: text,
            timestamp: commentId
        };
        
        firebase.database().ref(`comments/${this._activeCommentPostId}/${commentId}`).set(commentData)
            .then(() => {
                input.value = "";
                if (this.currentScreen === 'feed-screen') {
                    this.loadFeed();
                }
            })
            .catch(err => console.error("Post comment failed:", err));
    }

    startDirectChat(email) {
        const emailKey = email.replace(/\./g, '_');
        const creator = this._usersCache[emailKey] || {};
        const name = creator.name || creator.fullName || email.split('@')[0];
        const username = creator.username || email.split('@')[0];
        const avatar = creator.profilePic || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&fit=crop";
        
        if (!this._chats.some(c => c.id === username)) {
            this._chats.push({
                id: username,
                name: name,
                avatar: avatar,
                status: "Active now",
                lastMsg: "Let's chat about styling!",
                time: "1m"
            });
            this._chatHistory[username] = [
                { from: "them", text: "Let's chat about styling!", time: "1m" }
            ];
        }
        
        this.openChatThread(username);
    }

    goBack() {
        if (this._historyStack && this._historyStack.length > 0) {
            const prev = this._historyStack.pop();
            this._currentViewingUserEmail = prev.viewingUser;
            this.navigate(prev.screen, false);
            
            setTimeout(() => {
                if (prev.screen === 'feed-screen') {
                    const container = document.getElementById("feed-posts-scroll-container");
                    if (container) container.scrollTop = prev.scroll;
                } else {
                    window.scrollTo(0, prev.scroll);
                }
            }, 50);
        } else {
            this.navigate('home-screen');
        }
    }
}

const app = new FashionistApp();

// Consistently handle late-loading assets if needed, but app init is already handled in constructor
window.addEventListener("load", () => {
    console.log("FashionistApp: Window loaded.");
});