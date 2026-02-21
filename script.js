import './index.css';

(function() {
    // --- State Management ---
    const APP_KEY = 'taranom_quran_v2_rbac_multimedia';
    
    const defaultState = {
        users: [], 
        judges: [], 
        config: {
            headerTitle: "ترنم قرآن",
            moralNote: "هر هفته فرصتی تازه برای یادگیری کلام خداست.",
            daysLocked: [false, true, true], 
        },
        questions: [], 
        answers: [], 
        supportMessages: [] 
    };

    let state = loadState();
    let currentUser = null; 
    let adminQFilter = 'all';

    // --- Helper Functions ---

    function loadState() {
        const stored = localStorage.getItem(APP_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { 
                ...defaultState, 
                ...parsed, 
                config: { ...defaultState.config, ...parsed.config }
            };
        }
        
        // Seed initial data
        const initialState = JSON.parse(JSON.stringify(defaultState));
        initialState.questions.push(
            { 
                id: 'q1', 
                day: 1, 
                type: 'text', 
                text: 'اولین سوره قرآن چه نام دارد؟', 
                points: 10, 
                isBomb: false, 
                ageGroup: '7-11',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
            },
            { 
                id: 'q2', 
                day: 1, 
                type: 'text', 
                text: 'نام دیگر سوره حمد چیست؟ (سوال بمب)', 
                points: 50, 
                isBomb: true, 
                claimedBy: null, 
                ageGroup: '12-17',
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
            }
        );
        return initialState;
    }

    function saveState() {
        localStorage.setItem(APP_KEY, JSON.stringify(state));
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function toEnglishDigits(str) {
        if (!str) return '';
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return str.toString()
            .replace(/[۰-۹]/g, (w) => persianDigits.indexOf(w))
            .replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w));
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-brand-teal',
            warning: 'bg-brand-gold text-brand-dark'
        };
        
        toast.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-300 translate-y-10 opacity-0`;
        toast.innerHTML = `<span class="font-bold">${message}</span>`;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function createParticleBackground() {
        const container = document.getElementById('particles');
        if (!container) return;
        container.innerHTML = '';
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = `${Math.random() * 100}vw`;
            p.style.width = `${Math.random() * 5 + 2}px`;
            p.style.height = p.style.width;
            p.style.animationDuration = `${Math.random() * 10 + 10}s`;
            p.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(p);
        }
    }

    // --- Authentication ---

    function login(nationalId, password) {
        if (nationalId === '1275537839' && password === 'alireza.mf1387') {
            currentUser = { role: 'superadmin', firstName: 'مدیر', lastName: 'کل' };
            renderAdminDashboard('questions');
            return;
        }

        const judge = state.judges.find(j => j.nationalId === nationalId && j.password === password);
        if (judge) {
            currentUser = { ...judge, role: 'judge', firstName: judge.name, lastName: '(داور)' };
            renderAdminDashboard('answers');
            return;
        }

        const user = state.users.find(u => u.nationalId === nationalId && u.password === password);
        if (user) {
            currentUser = { ...user, role: 'user' };
            renderUserDashboard();
        } else {
            showToast('کد ملی یا رمز عبور اشتباه است', 'error');
        }
    }

    function register(data) {
        if (state.users.some(u => u.nationalId === data.nationalId)) {
            showToast('این کد ملی قبلاً ثبت شده است', 'error');
            return;
        }
        state.users.push({ id: generateId(), ...data, score: 0, answers: {} });
        saveState();
        showToast('ثبت نام با موفقیت انجام شد. وارد شوید.', 'success');
        renderLogin();
    }

    // --- Views ---

    const app = document.getElementById('app');

    function renderLogin() {
        app.innerHTML = `
            <div class="glass p-8 rounded-2xl w-full max-w-md fade-in text-center">
                <div class="flex justify-center mb-6">
                    <i data-lucide="moon" class="w-16 h-16 text-brand-gold"></i>
                </div>
                <h1 class="text-3xl font-bold mb-8 text-brand-teal">ترنم قرآن</h1>
                <form id="loginForm" class="space-y-4">
                    <input type="text" id="loginNID" placeholder="کد ملی (۱۰ رقم)" class="w-full bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal transition text-center" dir="ltr">
                    <input type="password" id="loginPass" placeholder="رمز عبور" class="w-full bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal transition text-center" dir="ltr">
                    <button type="submit" class="w-full bg-brand-teal hover:bg-teal-600 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-teal-500/20">ورود به سامانه</button>
                </form>
                <div class="mt-6 border-t border-gray-700 pt-4">
                    <p class="text-sm text-gray-400">حساب کاربری ندارید؟</p>
                    <button id="btnGoRegister" class="text-brand-gold hover:text-yellow-300 font-bold mt-2">ثبت نام کنید</button>
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const nid = toEnglishDigits(document.getElementById('loginNID').value).trim();
            const pass = document.getElementById('loginPass').value;
            if(!nid || !pass) return showToast('لطفا همه فیلدها را پر کنید', 'warning');
            login(nid, pass);
        });
        document.getElementById('btnGoRegister').addEventListener('click', renderRegister);
    }

    function renderRegister() {
        app.innerHTML = `
            <div class="glass p-8 rounded-2xl w-full max-w-lg fade-in">
                <h2 class="text-2xl font-bold mb-6 text-center text-brand-teal">ایجاد حساب کاربری</h2>
                <form id="registerForm" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <input type="text" id="regName" placeholder="نام" class="bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal">
                        <input type="text" id="regLName" placeholder="نام خانوادگی" class="bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal">
                    </div>
                    <input type="text" id="regFatherName" placeholder="نام پدر" class="w-full bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal">
                    <input type="text" id="regNID" placeholder="کد ملی (۱۰ رقم)" maxlength="10" class="w-full bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal text-left" dir="ltr">
                    <input type="password" id="regPass" placeholder="رمز عبور (حداقل ۸ کاراکتر)" minlength="8" class="w-full bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal text-left" dir="ltr">
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">سال تولد</label>
                        <input type="text" id="regBirthYear" placeholder="مثلا: ۱۳۹۰" maxlength="4" class="w-full bg-brand-surface border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-teal text-center" dir="ltr">
                    </div>
                    <button type="submit" class="w-full bg-brand-teal hover:bg-teal-600 text-white font-bold py-3 rounded-lg transition mt-4">ثبت نام</button>
                </form>
                <div class="mt-4 text-center">
                    <button id="btnBackLogin" class="text-gray-400 hover:text-white text-sm">بازگشت به ورود</button>
                </div>
            </div>
        `;
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const nid = toEnglishDigits(document.getElementById('regNID').value).trim();
            const birthYearStr = toEnglishDigits(document.getElementById('regBirthYear').value).trim();
            const data = {
                firstName: document.getElementById('regName').value.trim(),
                lastName: document.getElementById('regLName').value.trim(),
                fatherName: document.getElementById('regFatherName').value.trim(),
                nationalId: nid,
                password: document.getElementById('regPass').value.trim(),
                birthYear: parseInt(birthYearStr)
            };
            if (Object.values(data).some(v => !v)) return showToast('همه فیلدها الزامی هستند', 'error');
            const age = 1404 - data.birthYear;
            data.ageGroup = age <= 12 ? '7-11' : age <= 18 ? '12-17' : '18+';
            register(data);
        });
        document.getElementById('btnBackLogin').addEventListener('click', renderLogin);
    }

    function renderUserDashboard(activeDay = null, view = 'home') {
        if (!activeDay) {
            const unlockedIdx = state.config.daysLocked.findIndex(locked => !locked);
            activeDay = unlockedIdx !== -1 ? unlockedIdx + 1 : 1;
        }

        const agePeers = state.users.filter(u => u.ageGroup === currentUser.ageGroup).sort((a, b) => b.score - a.score).slice(0, 3);
        const dayLabels = ['روز اول', 'روز دوم', 'روز سوم'];
        
        let mainContent = '';
        if (view === 'support') {
            const myMessages = state.supportMessages.filter(m => m.userId === currentUser.id).sort((a, b) => b.timestamp - a.timestamp);
            mainContent = `
                <div class="glass p-6 md:p-8 rounded-3xl min-h-[500px]">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2 mb-6 border-b border-gray-700 pb-4">
                        <i data-lucide="message-circle" class="w-6 h-6 text-brand-gold"></i> پشتیبانی
                    </h2>
                    <div class="flex flex-col h-[500px]">
                        <div class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                            ${myMessages.length === 0 ? '<p class="text-center py-12 text-gray-500">هنوز پیامی ارسال نکرده‌اید</p>' : myMessages.map(msg => `
                                <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                    <p class="text-gray-200 text-sm mb-2">${msg.content}</p>
                                    ${msg.reply ? `<div class="bg-brand-teal/10 border-r-2 border-brand-teal p-3 rounded-lg mt-3 text-sm text-gray-300"><strong>پاسخ مدیر:</strong> ${msg.reply}</div>` : '<span class="text-xs text-yellow-500">در انتظار پاسخ...</span>'}
                                </div>
                            `).join('')}
                        </div>
                        <div class="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <textarea id="supportMsgInput" rows="2" class="w-full bg-brand-dark border border-gray-600 rounded-lg p-3 text-sm focus:border-brand-teal outline-none mb-3" placeholder="پیام خود را بنویسید..."></textarea>
                            <button onclick="window.sendSupportMessage()" class="w-full bg-brand-teal hover:bg-teal-600 text-white font-bold py-3 rounded-lg transition">ارسال پیام</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const dayQuestions = state.questions.filter(q => q.day === activeDay && q.ageGroup === currentUser.ageGroup);
            mainContent = `
                <div class="glass p-6 md:p-8 rounded-3xl min-h-[500px]">
                    <h2 class="text-2xl font-bold text-white mb-8 border-b border-gray-700 pb-4">سوالات ${dayLabels[activeDay - 1]}</h2>
                    <div class="space-y-6">
                        ${dayQuestions.length > 0 ? dayQuestions.map(q => {
                            const userAnswer = state.answers.find(a => a.questionId === q.id && a.userId === currentUser.id);
                            const isDisabled = userAnswer || (q.isBomb && q.claimedBy);
                            return `
                                <div class="glass-card p-5 rounded-2xl ${q.isBomb ? 'border-brand-gold bomb-glow' : ''}">
                                    <h3 class="font-bold text-lg mb-4 flex items-start gap-2">
                                        ${q.isBomb ? '<i data-lucide="bomb" class="w-5 h-5 text-brand-gold"></i>' : '<i data-lucide="help-circle" class="w-5 h-5 text-brand-teal"></i>'}
                                        ${q.text}
                                    </h3>
                                    ${q.audioUrl ? `<audio controls class="w-full mb-4"><source src="${q.audioUrl}" type="audio/mpeg"></audio>` : ''}
                                    ${q.videoUrl ? `<video controls class="w-full mb-4 rounded-lg"><source src="${q.videoUrl}" type="video/mp4"></video>` : ''}
                                    <textarea id="ans-${q.id}" rows="3" class="w-full bg-brand-dark border border-gray-700 rounded-lg p-3 focus:border-brand-teal outline-none transition mb-4" placeholder="پاسخ خود را بنویسید..." ${isDisabled ? 'disabled' : ''}>${userAnswer ? userAnswer.content : ''}</textarea>
                                    <div class="flex justify-between items-center">
                                        ${userAnswer ? `<span class="text-xs ${userAnswer.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}">${userAnswer.status === 'approved' ? `امتیاز: ${userAnswer.scoreAwarded}` : 'در انتظار بررسی'}</span>` : ''}
                                        ${!isDisabled ? `<button onclick="window.submitAnswer('${q.id}')" class="bg-brand-teal hover:bg-teal-600 text-white px-6 py-2 rounded-lg text-sm font-bold">ارسال پاسخ</button>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="text-center text-gray-500 py-12">سوالی یافت نشد.</p>'}
                    </div>
                </div>
            `;
        }

        app.innerHTML = `
            <div class="w-full max-w-6xl fade-in pb-10">
                <div class="glass p-6 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-dark font-bold text-2xl">${currentUser.firstName[0]}</div>
                        <div><h2 class="font-bold text-xl text-white">${currentUser.firstName} ${currentUser.lastName}</h2><span class="text-xs text-brand-gold">امتیاز: ${currentUser.score}</span></div>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-extrabold text-brand-teal">${state.config.headerTitle}</h1>
                    <button onclick="window.logout()" class="text-red-400 hover:text-red-300 text-sm flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">خروج</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-3 space-y-6">
                        <div class="glass p-5 rounded-2xl">
                            <h3 class="font-bold text-gray-300 mb-4 text-sm">روزهای هفته</h3>
                            <div class="flex flex-col gap-3">
                                ${dayLabels.map((label, i) => `<button onclick="window.selectDay(${i+1})" class="h-12 w-full rounded-xl font-bold border-2 ${activeDay === i+1 ? 'bg-brand-gold text-brand-dark border-brand-gold' : 'bg-brand-surface text-brand-teal border-brand-teal/30'}">${label}</button>`).join('')}
                            </div>
                        </div>
                        <button onclick="window.renderUserDashboard(null, 'support')" class="w-full glass p-4 rounded-xl flex items-center justify-between text-brand-gold border-brand-gold/30"><span>پشتیبانی</span><i data-lucide="headset" class="w-5 h-5"></i></button>
                    </div>
                    <div class="lg:col-span-9">${mainContent}</div>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    // --- Admin Dashboard ---

    function renderAdminDashboard(view = 'questions') {
        const isSuperAdmin = currentUser.role === 'superadmin';
        const isJudge = currentUser.role === 'judge';
        if (isJudge && view !== 'answers') view = 'answers';

        app.innerHTML = `
            <div class="w-full max-w-6xl fade-in pb-10">
                <div class="glass p-4 rounded-xl mb-6 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-white">پنل مدیریت ${isJudge ? `(${getAgeLabel(currentUser.assignedAgeGroup)})` : '(کل)'}</h1>
                    <button onclick="window.logout()" class="text-red-400 text-sm">خروج</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="glass p-4 rounded-xl space-y-2">
                        ${isSuperAdmin ? `<button onclick="window.setAdminView('questions')" class="w-full text-right px-4 py-3 rounded-lg ${view === 'questions' ? 'bg-brand-teal text-white' : 'text-gray-400'}">مدیریت سوالات</button>` : ''}
                        <button onclick="window.setAdminView('answers')" class="w-full text-right px-4 py-3 rounded-lg ${view === 'answers' ? 'bg-brand-teal text-white' : 'text-gray-400'}">بررسی پاسخ‌ها</button>
                        ${isSuperAdmin ? `<button onclick="window.setAdminView('messages')" class="w-full text-right px-4 py-3 rounded-lg ${view === 'messages' ? 'bg-brand-teal text-white' : 'text-gray-400'}">پیام‌ها</button>` : ''}
                    </div>
                    <div class="md:col-span-3 glass p-6 rounded-xl min-h-[600px]">
                        ${getAdminContent(view)}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    function getAdminContent(view) {
        if (view === 'questions') {
            return `
                <h2 class="text-xl font-bold mb-6">افزودن سوال جدید</h2>
                <div class="space-y-4 bg-gray-800/40 p-5 rounded-2xl mb-8">
                    <div class="grid grid-cols-2 gap-4">
                        <select id="newQDay" class="bg-brand-dark border border-gray-600 rounded-lg p-2.5 text-sm"><option value="1">روز اول</option><option value="2">روز دوم</option><option value="3">روز سوم</option></select>
                        <select id="newQAge" class="bg-brand-dark border border-gray-600 rounded-lg p-2.5 text-sm"><option value="7-11">کودکان</option><option value="12-17">نوجوانان</option><option value="18+">بزرگسالان</option></select>
                    </div>
                    <input type="text" id="newQText" placeholder="متن سوال" class="w-full bg-brand-dark border border-gray-600 rounded-lg p-2.5 text-sm">
                    <input type="text" id="newQAudio" placeholder="لینک صوت (اختیاری)" class="w-full bg-brand-dark border border-gray-600 rounded-lg p-2.5 text-sm">
                    <input type="text" id="newQVideo" placeholder="لینک ویدیو (اختیاری)" class="w-full bg-brand-dark border border-gray-600 rounded-lg p-2.5 text-sm">
                    <button onclick="window.addQuestion()" class="w-full bg-brand-teal text-white py-2 rounded-lg font-bold">افزودن</button>
                </div>
                <div class="space-y-3">
                    ${state.questions.map(q => `<div class="bg-gray-800 p-4 rounded-xl flex justify-between items-center"><span>${q.text}</span><button onclick="window.deleteQuestion('${q.id}')" class="text-red-400"><i data-lucide="trash-2"></i></button></div>`).join('')}
                </div>
            `;
        }
        if (view === 'answers') {
            const pending = state.answers.filter(a => a.status === 'pending');
            return `
                <h2 class="text-xl font-bold mb-6">بررسی پاسخ‌ها</h2>
                <div class="space-y-4">
                    ${pending.map(a => {
                        const u = state.users.find(u => u.id === a.userId);
                        const q = state.questions.find(q => q.id === a.questionId);
                        return `
                            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <p class="text-sm font-bold text-white mb-2">${u.firstName} ${u.lastName} - ${q.text}</p>
                                <p class="text-sm text-gray-300 mb-4">${a.content}</p>
                                <div class="flex gap-2">
                                    <input type="number" id="score-${a.id}" value="${q.points}" class="w-20 bg-brand-dark border border-gray-600 rounded p-1 text-center">
                                    <button onclick="window.gradeAnswer('${a.id}', 'approve')" class="bg-brand-teal text-white px-4 py-1 rounded">تایید</button>
                                    <button onclick="window.gradeAnswer('${a.id}', 'reject')" class="bg-red-500 text-white px-4 py-1 rounded">رد</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        if (view === 'messages') {
            return `
                <h2 class="text-xl font-bold mb-6">پیام‌های پشتیبانی</h2>
                <div class="space-y-4">
                    ${state.supportMessages.filter(m => !m.reply).map(msg => `
                        <div class="bg-gray-800 p-4 rounded-xl border border-brand-teal/50">
                            <p class="text-gray-200 text-sm mb-4">${msg.content}</p>
                            <div class="flex gap-2">
                                <input type="text" id="reply-${msg.id}" class="grow bg-brand-dark border border-gray-600 rounded-lg px-3 py-2 text-sm" placeholder="پاسخ...">
                                <button onclick="window.replySupportMessage('${msg.id}')" class="bg-brand-teal text-white px-4 py-2 rounded-lg text-sm font-bold">ارسال</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        return '';
    }

    // --- Global Actions ---
    window.selectDay = (day) => renderUserDashboard(day);
    window.setAdminView = (v) => renderAdminDashboard(v);
    window.logout = () => { currentUser = null; renderLogin(); };
    window.sendSupportMessage = () => {
        const txt = document.getElementById('supportMsgInput').value.trim();
        if(!txt) return;
        state.supportMessages.push({ id: generateId(), userId: currentUser.id, content: txt, reply: null, timestamp: Date.now() });
        saveState();
        showToast('پیام ارسال شد', 'success');
        renderUserDashboard(null, 'support');
    };
    window.replySupportMessage = (id) => {
        const txt = document.getElementById(`reply-${id}`).value.trim();
        const msg = state.supportMessages.find(m => m.id === id);
        if (msg) { msg.reply = txt; saveState(); showToast('پاسخ ارسال شد', 'success'); renderAdminDashboard('messages'); }
    };
    window.addQuestion = () => {
        const q = {
            id: generateId(),
            day: parseInt(document.getElementById('newQDay').value),
            ageGroup: document.getElementById('newQAge').value,
            text: document.getElementById('newQText').value.trim(),
            audioUrl: document.getElementById('newQAudio').value.trim(),
            videoUrl: document.getElementById('newQVideo').value.trim(),
            points: 10,
            type: 'text'
        };
        state.questions.push(q);
        saveState();
        renderAdminDashboard('questions');
    };
    window.deleteQuestion = (id) => { state.questions = state.questions.filter(q => q.id !== id); saveState(); renderAdminDashboard('questions'); };
    window.submitAnswer = (qId) => {
        const content = document.getElementById(`ans-${qId}`).value.trim();
        state.answers.push({ id: generateId(), userId: currentUser.id, questionId: qId, content, status: 'pending', timestamp: Date.now() });
        saveState();
        showToast('پاسخ ثبت شد', 'success');
        renderUserDashboard();
    };
    window.gradeAnswer = (ansId, action) => {
        const ans = state.answers.find(a => a.id === ansId);
        const user = state.users.find(u => u.id === ans.userId);
        if (action === 'approve') {
            const score = parseInt(document.getElementById(`score-${ansId}`).value);
            user.score += score;
            ans.status = 'approved';
            ans.scoreAwarded = score;
        } else { ans.status = 'rejected'; }
        saveState();
        renderAdminDashboard('answers');
    };

    createParticleBackground();
    renderLogin();
})();
