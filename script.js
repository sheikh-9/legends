// Supabase Configuration
const SUPABASE_URL = 'https://fgoylqtdqhzduuezctrf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb3lscXRkcWh6ZHV1ZXpjdHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTc1OTksImV4cCI6MjA3NDQ5MzU5OX0.FPjgccBsg1MFD5ntRZSC4DOO-t9ClMLOzO3lq8aj4LQ';
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase Key exists:', !!SUPABASE_ANON_KEY);
    
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase connected successfully');
        
        // Test connection
        testDatabaseConnection();
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showMessage('خطأ في الاتصال بقاعدة البيانات', 'error');
    }
    
    initializeSlider();
    setupEventListeners();
    loadTournamentData();
});
// Global Variables
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
let slideInterval;
let isAdminLoggedIn = false;
let currentTournament = null;

// Admin credentials (في التطبيق الحقيقي، يجب استخدام نظام مصادقة أكثر أماناً)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'fifa2026admin'
};

// DOM Elements
const adminModal = document.getElementById('adminModal');
const tournamentModal = document.getElementById('tournamentModal');
const adminBtn = document.getElementById('adminBtn');
const closeBtn = document.querySelector('.close');
const registrationForm = document.getElementById('registrationForm');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminContent = document.getElementById('adminContent');
const logoutBtn = document.getElementById('logoutBtn');


// Slider Functions
function initializeSlider() {
    if (slides.length > 0) {
        slides[0].classList.add('active');
        slideInterval = setInterval(nextSlide, 5000);
    }
}

function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

function prevSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

// Event Listeners Setup
function setupEventListeners() {
    // Slider controls
    document.querySelector('.next-btn')?.addEventListener('click', () => {
        clearInterval(slideInterval);
        nextSlide();
        slideInterval = setInterval(nextSlide, 5000);
    });

    document.querySelector('.prev-btn')?.addEventListener('click', () => {
        clearInterval(slideInterval);
        prevSlide();
        slideInterval = setInterval(nextSlide, 5000);
    });

    // Admin modal
    adminBtn?.addEventListener('click', openAdminModal);
    closeBtn?.addEventListener('click', closeAdminModal);
    
    // Admin login
    adminLoginForm?.addEventListener('submit', handleAdminLogin);
    logoutBtn?.addEventListener('click', handleAdminLogout);
    
    window.addEventListener('click', (event) => {
        if (event.target === adminModal) {
            closeAdminModal();
        }
        if (event.target === tournamentModal) {
            closeTournamentModal();
        }
    });

    // Registration form
    registrationForm?.addEventListener('submit', handleRegistration);

    // Admin tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Tournament Details Functions
function showTournamentDetails(tournamentType) {
    currentTournament = tournamentType;
    
    // Hide selection grid and show details section
    document.querySelector('.tournament-selection-grid').style.display = 'none';
    document.querySelector('.tournament-selection-header').style.display = 'none';
    document.getElementById('tournamentDetailsSection').style.display = 'block';
    
    // Set section title
    const titles = {
        'league': 'بطولة الدوري الممتاز',
        'online': 'كأس فيفا الرقمي',
        'offline': 'بطولة الأبطال الحضورية'
    };
    document.getElementById('selectedTournamentTitle').textContent = titles[tournamentType];
    
    // Load tournament data
    loadInlineTournamentDetails(tournamentType);
    
    // Setup tabs
    setupInlineTournamentTabs();
    
    // Scroll to details section
    document.getElementById('tournamentDetailsSection').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function hideTournamentDetails() {
    // Show selection grid and hide details section
    document.querySelector('.tournament-selection-grid').style.display = 'grid';
    document.querySelector('.tournament-selection-header').style.display = 'block';
    document.getElementById('tournamentDetailsSection').style.display = 'none';
    currentTournament = null;
    
    // Scroll back to tournaments section
    document.getElementById('tournaments').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function setupInlineTournamentTabs() {
    const tabBtns = document.querySelectorAll('.details-tab-btn');
    const tabPanes = document.querySelectorAll('.details-tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            const targetTab = btn.dataset.tab;
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

async function loadInlineTournamentDetails(tournamentType) {
    // Load overview
    loadInlineTournamentOverview(tournamentType);
    
    // Load standings/bracket
    if (tournamentType === 'league') {
        await loadInlineLeagueStandings();
    } else {
        await loadInlineBracket(tournamentType);
    }
    
    // Load matches
    await loadInlineTournamentMatches(tournamentType);
    
    // Load schedule
    loadInlineTournamentSchedule(tournamentType);
}
function loadInlineTournamentOverview(tournamentType) {
    const tournamentData = {
        'league': {
            info: [
                'نظام الدوري الدائري',
                '16 فريق مشارك',
                'مدة البطولة: 6 أسابيع',
                'نظام النقاط: فوز = 3، تعادل = 1، خسارة = 0'
            ],
            prizes: [
                'المركز الأول: 10,000 ريال',
                'المركز الثاني: 5,000 ريال',
                'المركز الثالث: 2,500 ريال',
                'أفضل لاعب: 1,000 ريال'
            ],
            rules: [
                'كل فريق يلعب ضد جميع الفرق مرة واحدة',
                'مدة المباراة: 6 دقائق',
                'صعوبة اللعب: Professional',
                'ممنوع استخدام الفرق المخصصة'
            ]
        },
        'online': {
            info: [
                'نظام الإقصاء المباشر',
                '32 لاعب مشارك',
                'مدة البطولة: 3 أيام',
                'اللعب عبر الإنترنت'
            ],
            prizes: [
                'البطل: 8,000 ريال',
                'الوصيف: 4,000 ريال',
                'المركز الثالث: 2,000 ريال',
                'المركز الرابع: 1,000 ريال'
            ],
            rules: [
                'من يخسر يخرج من البطولة',
                'مدة المباراة: 6 دقائق',
                'صعوبة اللعب: World Class',
                'يُسمح بجميع الفرق'
            ]
        },
        'offline': {
            info: [
                'نظام الإقصاء المباشر',
                '16 لاعب مشارك',
                'مدة البطولة: يوم واحد',
                'المكان: الرياض - مركز الألعاب'
            ],
            prizes: [
                'البطل: 15,000 ريال',
                'الوصيف: 7,500 ريال',
                'المركز الثالث: 3,000 ريال',
                'المركز الرابع: 1,500 ريال'
            ],
            rules: [
                'من يخسر يخرج من البطولة',
                'مدة المباراة: 6 دقائق',
                'صعوبة اللعب: Legendary',
                'فرق محددة فقط'
            ]
        }
    };
    
    const data = tournamentData[tournamentType];
    
    // Update info
    document.getElementById('tournamentInfoInline').innerHTML = 
        '<ul>' + data.info.map(item => `<li>${item}</li>`).join('') + '</ul>';
    
    // Update prizes
    document.getElementById('tournamentPrizesInline').innerHTML = 
        '<ul>' + data.prizes.map(item => `<li>${item}</li>`).join('') + '</ul>';
    
    // Update rules
    document.getElementById('tournamentRulesInline').innerHTML = 
        '<ul>' + data.rules.map(item => `<li>${item}</li>`).join('') + '</ul>';
}

async function loadInlineLeagueStandings() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('league_standings')
            .select('*')
            .order('points', { ascending: false })
            .order('goal_difference', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('tournamentStandings');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p>لا توجد بيانات حتى الآن</p>';
            return;
        }

        container.innerHTML = `
            <div class="detailed-table">
                <h4>جدول ترتيب الدوري الممتاز</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>الترتيب</th>
                                <th>الفريق</th>
                                <th>لعب</th>
                                <th>فوز</th>
                                <th>تعادل</th>
                                <th>خسارة</th>
                                <th>له</th>
                                <th>عليه</th>
                                <th>الفارق</th>
                                <th>النقاط</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map((team, index) => `
                                <tr>
                                    <td><strong>${index + 1}</strong></td>
                                    <td><strong>${team.team_name}</strong></td>
                                    <td>${team.matches_played}</td>
                                    <td>${team.wins}</td>
                                    <td>${team.draws}</td>
                                    <td>${team.losses}</td>
                                    <td>${team.goals_for}</td>
                                    <td>${team.goals_against}</td>
                                    <td>${team.goal_difference > 0 ? '+' : ''}${team.goal_difference}</td>
                                    <td><strong>${team.points}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading detailed standings:', error);
    }
}

async function loadInlineBracket(tournamentType) {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('knockout_matches')
            .select('*')
            .eq('tournament_type', tournamentType)
            .order('round', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('tournamentStandings');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p>سيتم عرض شجرة البطولة عند بدء المباريات</p>';
            return;
        }

        // Group matches by round
        const rounds = {};
        data.forEach(match => {
            if (!rounds[match.round]) {
                rounds[match.round] = [];
            }
            rounds[match.round].push(match);
        });

        container.innerHTML = `
            <div class="detailed-table">
                <h4>شجرة ${tournamentType === 'online' ? 'كأس فيفا الرقمي' : 'بطولة الأبطال الحضورية'}</h4>
                <div class="bracket-container">
                    ${Object.keys(rounds).map(round => `
                        <div class="bracket-round">
                            <h5>الجولة ${round}</h5>
                            <div class="bracket-matches">
                                ${rounds[round].map(match => `
                                    <div class="bracket-match">
                                        <div class="bracket-team ${match.team1_score > match.team2_score ? 'winner' : match.team2_score > match.team1_score ? 'loser' : ''}">
                                            ${match.team1_name} ${match.team1_score !== null ? match.team1_score : ''}
                                        </div>
                                        <div class="vs">VS</div>
                                        <div class="bracket-team ${match.team2_score > match.team1_score ? 'winner' : match.team1_score > match.team2_score ? 'loser' : ''}">
                                            ${match.team2_name} ${match.team2_score !== null ? match.team2_score : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading detailed bracket:', error);
    }
}

async function loadInlineTournamentMatches(tournamentType) {
    if (!supabase) return;
    
    try {
        let data, error;
        
        if (tournamentType === 'league') {
            ({ data, error } = await supabase
                .from('league_matches')
                .select('*')
                .order('match_date', { ascending: false }));
        } else {
            ({ data, error } = await supabase
                .from('knockout_matches')
                .select('*')
                .eq('tournament_type', tournamentType)
                .order('match_date', { ascending: false }));
        }

        if (error) throw error;

        const container = document.getElementById('tournamentMatches');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p>لا توجد مباريات حتى الآن</p>';
            return;
        }

        container.innerHTML = `
            <div class="detailed-table">
                <h4>المباريات</h4>
                <div class="match-list">
                    ${data.map(match => `
                        <div class="match-item">
                            <div class="match-info">
                                <div class="match-teams">${match.team1_name} VS ${match.team2_name}</div>
                                <div class="match-date">${new Date(match.match_date).toLocaleDateString('ar-SA')}</div>
                            </div>
                            <div class="match-score">
                                ${match.team1_score !== null ? `${match.team1_score} - ${match.team2_score}` : 'لم تحدد'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading tournament matches:', error);
    }
}

function loadInlineTournamentSchedule(tournamentType) {
    const schedules = {
        'league': [
            {
                day: 'الأسبوع الأول',
                matches: [
                    { time: '19:00', teams: 'الأهلي VS الهلال', venue: 'أونلاين' },
                    { time: '20:00', teams: 'النصر VS الاتحاد', venue: 'أونلاين' },
                    { time: '21:00', teams: 'الشباب VS التعاون', venue: 'أونلاين' }
                ]
            },
            {
                day: 'الأسبوع الثاني',
                matches: [
                    { time: '19:00', teams: 'الأهلي VS النصر', venue: 'أونلاين' },
                    { time: '20:00', teams: 'الهلال VS الاتحاد', venue: 'أونلاين' },
                    { time: '21:00', teams: 'الشباب VS التعاون', venue: 'أونلاين' }
                ]
            }
        ],
        'online': [
            {
                day: 'اليوم الأول - دور الـ32',
                matches: [
                    { time: '16:00', teams: 'مباراة 1', venue: 'أونلاين' },
                    { time: '16:30', teams: 'مباراة 2', venue: 'أونلاين' },
                    { time: '17:00', teams: 'مباراة 3', venue: 'أونلاين' }
                ]
            },
            {
                day: 'اليوم الثاني - دور الـ16',
                matches: [
                    { time: '18:00', teams: 'مباراة ربع النهائي 1', venue: 'أونلاين' },
                    { time: '18:30', teams: 'مباراة ربع النهائي 2', venue: 'أونلاين' }
                ]
            }
        ],
        'offline': [
            {
                day: 'صباح البطولة',
                matches: [
                    { time: '09:00', teams: 'دور الـ16 - مباراة 1', venue: 'القاعة A' },
                    { time: '09:30', teams: 'دور الـ16 - مباراة 2', venue: 'القاعة B' },
                    { time: '10:00', teams: 'دور الـ16 - مباراة 3', venue: 'القاعة A' }
                ]
            },
            {
                day: 'مساء البطولة',
                matches: [
                    { time: '18:00', teams: 'نصف النهائي الأول', venue: 'القاعة الرئيسية' },
                    { time: '19:00', teams: 'نصف النهائي الثاني', venue: 'القاعة الرئيسية' },
                    { time: '20:00', teams: 'المباراة النهائية', venue: 'القاعة الرئيسية' }
                ]
            }
        ]
    };
    
    const schedule = schedules[tournamentType];
    const container = document.getElementById('tournamentSchedule');
    
    container.innerHTML = schedule.map(day => `
        <div class="schedule-day">
            <h5>${day.day}</h5>
            <div class="schedule-matches">
                ${day.matches.map(match => `
                    <div class="schedule-match">
                        <div class="schedule-time">${match.time}</div>
                        <div class="schedule-teams">${match.teams}</div>
                        <div class="schedule-venue">${match.venue}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Modal Functions
function openAdminModal() {
    adminModal.style.display = 'block';
    if (isAdminLoggedIn) {
        showAdminContent();
        loadPendingRegistrations();
    } else {
        showAdminLogin();
    }
}

function closeAdminModal() {
    adminModal.style.display = 'none';
}

function closeTournamentModal() {
    tournamentModal.style.display = 'none';
}

function showAdminLogin() {
    adminLoginForm.style.display = 'block';
    adminContent.style.display = 'none';
}

function showAdminContent() {
    adminLoginForm.style.display = 'none';
    adminContent.style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    loadPendingRegistrations();
}

// Admin Authentication
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAdminLoggedIn = true;
        showAdminContent();
        loadPendingRegistrations();
        loadTournamentData();
        showMessage('تم تسجيل الدخول بنجاح', 'success');
        document.getElementById('adminLoginForm').reset();
    } else {
        showMessage('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
}

function handleAdminLogout() {
    isAdminLoggedIn = false;
    showAdminLogin();
    document.getElementById('logoutBtn').style.display = 'none';
    showMessage('تم تسجيل الخروج بنجاح', 'success');
}

function switchTab(tabName) {
    if (!isAdminLoggedIn) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    // Update tab buttons
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab panes
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Handle special case for tournaments tab
    const targetPane = tabName === 'tournaments' ? 
        document.getElementById('tournaments-tab') : 
        document.getElementById(tabName);
    
    if (targetPane) {
        targetPane.classList.add('active');
    }
}

// Registration Functions
async function handleRegistration(e) {
    e.preventDefault();
    
    if (!supabase) {
        showMessage('قاعدة البيانات غير متصلة', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitBtn.disabled = true;
    
    const formData = new FormData(registrationForm);
    const registrationData = {
        player_name: formData.get('playerName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        tournament_type: formData.get('tournament'),
        experience_level: formData.get('experience'),
        status: 'pending',
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await supabase
            .from('registrations')
            .insert([registrationData]);

        if (error) throw error;

        showMessage('تم إرسال طلب التسجيل بنجاح! سيتم مراجعته قريباً.', 'success');
        registrationForm.reset();
    } catch (error) {
        console.error('Error submitting registration:', error);
        showMessage('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Admin Functions
async function loadPendingRegistrations() {
    if (!supabase) {
        showMessage('قاعدة البيانات غير متصلة', 'error');
        return;
    }
    
    if (!isAdminLoggedIn) {
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayPendingRegistrations(data || []);
    } catch (error) {
        console.error('Error loading registrations:', error);
        showMessage('خطأ في تحميل طلبات التسجيل', 'error');
    }
}

function displayPendingRegistrations(registrations) {
    const container = document.getElementById('pendingRegistrations');
    
    if (registrations.length === 0) {
        container.innerHTML = '<p>لا توجد طلبات تسجيل معلقة</p>';
        return;
    }

    container.innerHTML = registrations.map(reg => `
        <div class="request-card">
            <div class="request-info">
                <div><strong>الاسم:</strong> ${reg.player_name}</div>
                <div><strong>البريد:</strong> ${reg.email}</div>
                <div><strong>الهاتف:</strong> ${reg.phone}</div>
                <div><strong>البطولة:</strong> ${getTournamentName(reg.tournament_type)}</div>
                <div><strong>المستوى:</strong> ${getExperienceName(reg.experience_level)}</div>
                <div><strong>التاريخ:</strong> ${new Date(reg.created_at).toLocaleDateString('ar-SA')}</div>
            </div>
            <div class="request-actions">
                <button class="approve-btn" onclick="approveRegistration('${reg.id}')">
                    <i class="fas fa-check"></i> موافقة
                </button>
                <button class="reject-btn" onclick="rejectRegistration('${reg.id}')">
                    <i class="fas fa-times"></i> رفض
                </button>
            </div>
        </div>
    `).join('');
}

async function approveRegistration(id) {
    if (!supabase) {
        showMessage('قاعدة البيانات غير متصلة', 'error');
        return;
    }
    
    if (!isAdminLoggedIn) {
        showMessage('غير مصرح لك بهذا الإجراء', 'error');
        return;
    }
    
    try {
        console.log('Approving registration with ID:', id);
        
        const { error } = await supabase
            .from('registrations')
            .update({ 
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('id', String(id));

        if (error) {
            console.error('Approval error:', error);
            throw error;
        }

        showMessage('تم قبول طلب التسجيل بنجاح', 'success');
        loadPendingRegistrations();
        loadTournamentData();
    } catch (error) {
        console.error('Error approving registration:', error);
        showMessage('خطأ في قبول الطلب: ' + error.message, 'error');
    }
}

async function rejectRegistration(id) {
    if (!supabase) {
        showMessage('قاعدة البيانات غير متصلة', 'error');
        return;
    }
    
    if (!isAdminLoggedIn) {
        showMessage('غير مصرح لك بهذا الإجراء', 'error');
        return;
    }
    
    try {
        console.log('Rejecting registration with ID:', id);
        
        const { error } = await supabase
            .from('registrations')
            .update({ 
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', String(id));

        if (error) {
            console.error('Rejection error:', error);
            throw error;
        }

        showMessage('تم رفض طلب التسجيل', 'success');
        loadPendingRegistrations();
    } catch (error) {
        console.error('Error rejecting registration:', error);
        showMessage('خطأ في رفض الطلب: ' + error.message, 'error');
    }
}

// Tournament Management Functions
async function loadTournamentData() {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return;
    }
    
    try {
        // Update tournament statuses
        await updateTournamentStatuses();
    } catch (error) {
        console.error('Error loading tournament data:', error);
    }
    
    // Load matches for admin panel
    if (isAdminLoggedIn) {
        loadMatchesForAdmin();
    }
}


// Load matches for admin management
async function loadMatchesForAdmin() {
    if (!isAdminLoggedIn) return;
    
    try {
        // Load league matches
        const { data: leagueMatches, error: leagueError } = await supabase
            .from('league_matches')
            .select('*')
            .order('match_date', { ascending: false });

        if (leagueError) throw leagueError;

        displayMatchesForAdmin('leagueMatches', leagueMatches || [], 'league');

        // Load knockout matches
        const { data: knockoutMatches, error: knockoutError } = await supabase
            .from('knockout_matches')
            .select('*')
            .order('match_date', { ascending: false });

        if (knockoutError) throw knockoutError;

        displayMatchesForAdmin('knockoutMatches', knockoutMatches || [], 'knockout');
    } catch (error) {
        console.error('Error loading matches for admin:', error);
    }
}

function displayMatchesForAdmin(containerId, matches, type) {
    const container = document.getElementById(containerId);
    
    if (matches.length === 0) {
        container.innerHTML = '<p>لا توجد مباريات</p>';
        return;
    }

    container.innerHTML = matches.map(match => `
        <div class="match-card">
            <div class="match-info">
                <div class="match-teams">
                    ${match.team1_name} VS ${match.team2_name}
                </div>
                <div class="match-score">
                    ${match.team1_score !== null ? `${match.team1_score} - ${match.team2_score}` : 'لم تحدد النتيجة'}
                </div>
                <div class="match-date">
                    ${new Date(match.match_date).toLocaleDateString('ar-SA')}
                </div>
            </div>
            <div class="match-actions">
                <button class="edit-btn" onclick="editMatch('${match.id}', '${type}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="delete-btn" onclick="deleteResult('${match.id}', '${type}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// Edit match function
async function editMatch(matchId, matchType) {
    if (!isAdminLoggedIn) {
        showMessage('غير مصرح لك بهذا الإجراء', 'error');
        return;
    }
    
    const newTeam1 = prompt('اسم الفريق الأول:');
    const newTeam2 = prompt('اسم الفريق الثاني:');
    const newScore1 = prompt('نتيجة الفريق الأول:');
    const newScore2 = prompt('نتيجة الفريق الثاني:');
    
    if (newTeam1 && newTeam2 && newScore1 !== null && newScore2 !== null) {
        try {
            const tableName = matchType === 'league' ? 'league_matches' : 'knockout_matches';
            const { error } = await supabase
                .from(tableName)
                .update({
                    team1_name: newTeam1,
                    team2_name: newTeam2,
                    team1_score: parseInt(newScore1),
                    team2_score: parseInt(newScore2)
                })
                .eq('id', matchId);

            if (error) throw error;

            showMessage('تم تحديث المباراة بنجاح', 'success');
            loadTournamentData();
            loadMatchesForAdmin();
            
            // إعادة حساب ترتيب الدوري إذا كانت مباراة دوري
            if (matchType === 'league') {
                await recalculateLeagueStandings();
            }
        } catch (error) {
            console.error('Error updating match:', error);
            showMessage('خطأ في تحديث المباراة', 'error');
        }
    }
}

async function updateTournamentStatuses() {
    try {
        // Get registration counts for each tournament
        const { data: registrations, error } = await supabase
            .from('registrations')
            .select('tournament_type')
            .eq('status', 'approved');

        if (error) throw error;

        // Count registrations by tournament type
        const counts = {};
        registrations.forEach(reg => {
            counts[reg.tournament_type] = (counts[reg.tournament_type] || 0) + 1;
        });

        // Update status badges based on registration counts
        updateStatusBadge('league', counts.league || 0, 16);
        updateStatusBadge('online', counts.online || 0, 32);
        updateStatusBadge('offline', counts.offline || 0, 32);
    } catch (error) {
        console.error('Error updating tournament statuses:', error);
    }
}

function updateStatusBadge(tournamentType, currentCount, maxCount) {
    const card = document.querySelector(`.tournament-card:nth-child(${getTournamentIndex(tournamentType)})`);
    const badge = card.querySelector('.status-badge');
    
    if (currentCount >= maxCount) {
        badge.textContent = 'مغلق - اكتمل العدد';
        badge.className = 'status-badge closed';
    } else if (currentCount > 0) {
        badge.textContent = `جاري اللعب (${currentCount}/${maxCount})`;
        badge.className = 'status-badge playing';
    } else {
        badge.textContent = 'مفتوح للتسجيل';
        badge.className = 'status-badge open';
    }
}

function getTournamentIndex(type) {
    switch (type) {
        case 'league': return 1;
        case 'online': return 2;
        case 'offline': return 3;
        default: return 1;
    }
}

// Results Management
async function addResult() {
    if (!isAdminLoggedIn) {
        showMessage('غير مصرح لك بهذا الإجراء', 'error');
        return;
    }
    
    const tournament = document.getElementById('matchTournament').value;
    const team1 = document.getElementById('team1').value;
    const team2 = document.getElementById('team2').value;
    const score1 = parseInt(document.getElementById('score1').value);
    const score2 = parseInt(document.getElementById('score2').value);

    if (!tournament || !team1 || !team2 || isNaN(score1) || isNaN(score2)) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }

    try {
        if (tournament === 'league') {
            await addLeagueResult(team1, team2, score1, score2);
        } else {
            await addKnockoutResult(tournament, team1, team2, score1, score2);
        }

        showMessage('تم إضافة النتيجة بنجاح', 'success');
        clearResultsForm();
        loadTournamentData();
    } catch (error) {
        console.error('Error adding result:', error);
        showMessage('خطأ في إضافة النتيجة', 'error');
    }
}

async function addLeagueResult(team1, team2, score1, score2) {
    // Add match result
    const { error: matchError } = await supabase
        .from('league_matches')
        .insert([{
            team1_name: team1,
            team2_name: team2,
            team1_score: score1,
            team2_score: score2,
            match_date: new Date().toISOString()
        }]);

    if (matchError) throw matchError;

    // Update standings
    await updateLeagueStandings(team1, team2, score1, score2);
}

async function updateLeagueStandings(team1, team2, score1, score2) {
    // Calculate points
    let team1Points = 0, team2Points = 0;
    if (score1 > score2) {
        team1Points = 3;
    } else if (score2 > score1) {
        team2Points = 3;
    } else {
        team1Points = team2Points = 1;
    }

    // Update team1 standings
    await updateTeamStandings(team1, team1Points, score1, score2);
    
    // Update team2 standings
    await updateTeamStandings(team2, team2Points, score2, score1);
}

async function updateTeamStandings(teamName, points, goalsFor, goalsAgainst) {
    const { data: existing, error: selectError } = await supabase
        .from('league_standings')
        .select('*')
        .eq('team_name', teamName)
        .single();

    if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
    }

    if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
            .from('league_standings')
            .update({
                matches_played: existing.matches_played + 1,
                points: existing.points + points,
                goals_for: existing.goals_for + goalsFor,
                goals_against: existing.goals_against + goalsAgainst,
                goal_difference: (existing.goals_for + goalsFor) - (existing.goals_against + goalsAgainst)
            })
            .eq('team_name', teamName);

        if (updateError) throw updateError;
    } else {
        // Create new record
        const { error: insertError } = await supabase
            .from('league_standings')
            .insert([{
                team_name: teamName,
                matches_played: 1,
                points: points,
                goals_for: goalsFor,
                goals_against: goalsAgainst,
                goal_difference: goalsFor - goalsAgainst
            }]);

        if (insertError) throw insertError;
    }
}

async function addKnockoutResult(tournament, team1, team2, score1, score2) {
    const { error } = await supabase
        .from('knockout_matches')
        .insert([{
            tournament_type: tournament,
            team1_name: team1,
            team2_name: team2,
            team1_score: score1,
            team2_score: score2,
            round: 1, // This should be calculated based on tournament progress
            match_date: new Date().toISOString()
        }]);

    if (error) throw error;
}

function clearResultsForm() {
    document.getElementById('matchTournament').value = '';
    document.getElementById('team1').value = '';
    document.getElementById('team2').value = '';
    document.getElementById('score1').value = '';
    document.getElementById('score2').value = '';
}

// Delete Result Function
async function deleteResult(resultId, resultType) {
    if (!isAdminLoggedIn) {
        showMessage('غير مصرح لك بهذا الإجراء', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذه النتيجة؟')) {
        return;
    }
    
    try {
        const tableName = resultType === 'league' ? 'league_matches' : 'knockout_matches';
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', resultId);

        if (error) throw error;

        showMessage('تم حذف النتيجة بنجاح', 'success');
        loadTournamentData();
        loadMatchesForAdmin();
        
        // إعادة حساب ترتيب الدوري إذا كانت مباراة دوري
        if (resultType === 'league') {
            await recalculateLeagueStandings();
        }
    } catch (error) {
        console.error('Error deleting result:', error);
        showMessage('خطأ في حذف النتيجة', 'error');
    }
}

// Recalculate League Standings
async function recalculateLeagueStandings() {
    try {
        // مسح الترتيب الحالي
        const { error: deleteError } = await supabase
            .from('league_standings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
            console.log('Delete error (expected):', deleteError);
        }
        
        // إعادة حساب من جميع المباريات
        const { data: matches, error } = await supabase
            .from('league_matches')
            .select('*');

        if (error) throw error;

        const standings = {};
        
        matches.forEach(match => {
            if (match.team1_score !== null && match.team2_score !== null) {
                // تهيئة الفرق إذا لم تكن موجودة
                if (!standings[match.team1_name]) {
                    standings[match.team1_name] = {
                        team_name: match.team1_name,
                        matches_played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        goals_for: 0,
                        goals_against: 0,
                        goal_difference: 0,
                        points: 0
                    };
                }
                if (!standings[match.team2_name]) {
                    standings[match.team2_name] = {
                        team_name: match.team2_name,
                        matches_played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        goals_for: 0,
                        goals_against: 0,
                        goal_difference: 0,
                        points: 0
                    };
                }
                
                // تحديث إحصائيات الفريق الأول
                standings[match.team1_name].matches_played++;
                standings[match.team1_name].goals_for += match.team1_score;
                standings[match.team1_name].goals_against += match.team2_score;
                
                // تحديث إحصائيات الفريق الثاني
                standings[match.team2_name].matches_played++;
                standings[match.team2_name].goals_for += match.team2_score;
                standings[match.team2_name].goals_against += match.team1_score;
                
                // تحديد النتيجة والنقاط
                if (match.team1_score > match.team2_score) {
                    standings[match.team1_name].wins++;
                    standings[match.team1_name].points += 3;
                    standings[match.team2_name].losses++;
                } else if (match.team2_score > match.team1_score) {
                    standings[match.team2_name].wins++;
                    standings[match.team2_name].points += 3;
                    standings[match.team1_name].losses++;
                } else {
                    standings[match.team1_name].draws++;
                    standings[match.team1_name].points++;
                    standings[match.team2_name].draws++;
                    standings[match.team2_name].points++;
                }
                
                // حساب فارق الأهداف
                standings[match.team1_name].goal_difference = 
                    standings[match.team1_name].goals_for - standings[match.team1_name].goals_against;
                standings[match.team2_name].goal_difference = 
                    standings[match.team2_name].goals_for - standings[match.team2_name].goals_against;
            }
        });
        
        // إدراج الترتيب الجديد
        const standingsArray = Object.values(standings);
        if (standingsArray.length > 0) {
            const { error: insertError } = await supabase
                .from('league_standings')
                .insert(standingsArray);
                
            if (insertError) throw insertError;
        }
        
    } catch (error) {
        console.error('Error recalculating standings:', error);
    }
}

// Tournament Creation Functions
async function createTournament() {
    if (!isAdminLoggedIn) {
        showMessage('غير مصرح لك بهذا الإجراء', 'error');
        return;
    }
    
    const tournamentType = prompt('نوع البطولة (league/online/offline):');
    const tournamentName = prompt('اسم البطولة:');
    
    if (!tournamentType || !tournamentName) return;

    try {
        const { error } = await supabase
            .from('tournaments')
            .insert([{
                name: tournamentName,
                type: tournamentType,
                status: 'open',
                max_participants: tournamentType === 'league' ? 16 : 32,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        showMessage('تم إنشاء البطولة بنجاح', 'success');
        loadTournamentData();
    } catch (error) {
        console.error('Error creating tournament:', error);
        showMessage('خطأ في إنشاء البطولة', 'error');
    }
}

// Utility Functions
function getTournamentName(type) {
    switch (type) {
        case 'league': return 'بطولة الدوري';
        case 'online': return 'فيفا عن بعد';
        case 'offline': return 'فيفا حضوري';
        default: return type;
    }
}

function getExperienceName(level) {
    switch (level) {
        case 'beginner': return 'مبتدئ';
        case 'intermediate': return 'متوسط';
        case 'advanced': return 'متقدم';
        case 'professional': return 'محترف';
        default: return level;
    }
}

function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    // Insert message at the top of the page
    const header = document.querySelector('.header');
    if (header && header.nextSibling) {
        document.body.insertBefore(message, header.nextSibling);
    } else {
        document.body.insertBefore(message, document.body.firstChild);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (message && message.parentNode) {
            message.remove();
        }
    }, 5000);
}

// Video play functionality
document.addEventListener('click', function(e) {
    if (e.target.closest('.play-button')) {
        // Here you would implement video playing functionality
        // For now, just show an alert
        alert('سيتم تشغيل المقطع قريباً');
    }
});

// Test database connection
async function testDatabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('Database connection test failed:', error);
            showMessage('فشل في الاتصال بقاعدة البيانات: ' + error.message, 'error');
        } else {
            console.log('Database connection successful');
            showMessage('تم الاتصال بقاعدة البيانات بنجاح', 'success');
        }
    } catch (error) {
        console.error('Database test error:', error);
        showMessage('خطأ في اختبار قاعدة البيانات', 'error');
    }
}
// Smooth scroll for navigation
function smoothScroll(target) {
    document.querySelector(target).scrollIntoView({
        behavior: 'smooth'
    });
}

// Initialize tooltips and other UI enhancements
function initializeUIEnhancements() {
    // Add loading states to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('loading')) {
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading"></span> جاري التحميل...';
                this.classList.add('loading');
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('loading');
                }, 2000);
            }
        });
    });
}

// Call UI enhancements after DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUIEnhancements);
