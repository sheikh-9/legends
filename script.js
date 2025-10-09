// Supabase Configuration
const SUPABASE_URL = 'https://vieqwfkpxwdwlchdvdmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZXF3ZmtweHdkd2xjaGR2ZG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzQ1NTksImV4cCI6MjA3NTYxMDU1OX0.gQln3CMs3h2OrIljcvndImifrReHkOMhYLC7K5ZOyGg';
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
// Global Variables
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
let slideInterval;
let currentTournament = null;
let supabase;

// DOM Elements
const tournamentModal = document.getElementById('tournamentModal');
const registrationForm = document.getElementById('registrationForm');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تحميل الموقع...');
    
    // Initialize Supabase
    initializeSupabase();
    
    // Initialize other components
    initializeSlider();
    setupEventListeners();
    loadTournamentData();
});

// Initialize Supabase
function initializeSupabase() {
    // Get Supabase credentials from environment or use defaults
    const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || document.querySelector('meta[name="supabase-url"]')?.content || 'https://vieqwfkpxwdwlchdvdmn.supabase.co';
    const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || document.querySelector('meta[name="supabase-key"]')?.content || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZXF3ZmtweHdkd2xjaGR2ZG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzQ1NTksImV4cCI6MjA3NTYxMDU1OX0.gQln3CMs3h2OrIljcvndImifrReHkOMhYLC7K5ZOyGg';
    
    console.log('🔗 محاولة الاتصال بـ Supabase...');
    console.log('📍 URL:', SUPABASE_URL);
    console.log('🔑 Key exists:', !!SUPABASE_ANON_KEY);
    
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('❌ مكتبة Supabase غير محملة!');
            showMessage('خطأ: مكتبة قاعدة البيانات غير محملة', 'error');
            return;
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ تم إنشاء عميل Supabase بنجاح');
        
        // Test connection immediately
        testDatabaseConnection();
        
    } catch (error) {
        console.error('❌ فشل في إنشاء عميل Supabase:', error);
        showMessage('خطأ في الاتصال بقاعدة البيانات: ' + error.message, 'error');
    }
}

// Test database connection
async function testDatabaseConnection() {
    if (!supabase) {
        console.error('❌ عميل Supabase غير متاح');
        showMessage('❌ عميل Supabase غير متاح - تحقق من الاتصال', 'error');
        return;
    }
    
    console.log('🧪 اختبار الاتصال بقاعدة البيانات...');
    
    try {
        // Test each table individually
        const tables = [
            'tournaments',
            'registrations', 
            'league_standings',
            'league_matches',
            'knockout_matches',
            'tournament_participants'
        ];
        
        let missingTables = [];
        
        for (const table of tables) {
            console.log(`🔍 اختبار جدول: ${table}`);
            
            const { data, error } = await supabase
                .from(table)
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                console.error(`❌ خطأ في جدول ${table}:`, error);
                if (error.code === '42P01') {
                    missingTables.push(table);
                } else {
                    throw error;
                }
            } else {
                console.log(`✅ جدول ${table} متاح`);
            }
        }
        
        if (missingTables.length > 0) {
            console.error('❌ الجداول التالية غير موجودة:', missingTables);
            showDatabaseSetupInstructions(missingTables);
            return;
        }
        
        // All tests passed
        console.log('🎉 جميع الاختبارات نجحت! قاعدة البيانات متصلة ومضبوطة');
        showMessage('✅ تم الاتصال بقاعدة البيانات بنجاح', 'success');
        
        // Show current database info
        console.log('📊 معلومات قاعدة البيانات:');
        console.log('🔗 URL:', SUPABASE_URL);
        console.log('🆔 Project ID:', SUPABASE_URL.split('//')[1]?.split('.')[0]);
        
        // Load initial data
        await loadInitialData();
        
    } catch (error) {
        console.error('💥 فشل اختبار قاعدة البيانات:', error);
        showMessage('❌ فشل في الاتصال بقاعدة البيانات: ' + error.message, 'error');
        
        // Show detailed error info
        if (error.code) {
            console.error('🔍 كود الخطأ:', error.code);
        }
        if (error.details) {
            console.error('🔍 تفاصيل الخطأ:', error.details);
        }
        if (error.hint) {
            console.error('🔍 اقتراح الحل:', error.hint);
        }
    }
}

// Show database setup instructions
function showDatabaseSetupInstructions(missingTables) {
    console.log('📋 تعليمات إعداد قاعدة البيانات:');
    console.log('الجداول المفقودة:', missingTables);
    
    const instructions = `
🔧 لإصلاح قاعدة البيانات:

1️⃣ اذهب إلى: https://supabase.com/dashboard
2️⃣ اختر مشروعك
3️⃣ اذهب إلى SQL Editor
4️⃣ انسخ محتوى الملف: supabase/migrations/create_complete_tournament_system.sql
5️⃣ شغل الكود في SQL Editor
6️⃣ حدث هذه الصفحة

📁 الملف موجود في مجلد المشروع
`;
    
    showMessage('⚠️ قاعدة البيانات غير مضبوطة - راجع Console للتعليمات', 'error');
    console.log(instructions);
}

// Load initial data after successful connection
async function loadInitialData() {
    console.log('📊 تحميل البيانات الأولية...');
    
    try {
        // Load tournament statistics
        await updateTournamentStatuses();
        console.log('✅ تم تحميل إحصائيات البطولات');
        
        // Load some sample standings if available
        await loadSampleStandings();
        console.log('✅ تم تحميل بيانات الترتيب');
        
        // Load sample matches
        await loadSampleMatches();
        console.log('✅ تم تحميل بيانات المباريات');
        
    } catch (error) {
        console.error('⚠️ خطأ في تحميل البيانات الأولية:', error);
    }
}

// Load sample standings for display
async function loadSampleStandings() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('league_standings')
            .select('*')
            .order('points', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('📈 عدد الفرق في الترتيب:', data.length);
        } else {
            console.log('📝 لا توجد بيانات ترتيب حتى الآن');
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الترتيب:', error);
    }
}

// Load sample matches for display
async function loadSampleMatches() {
    if (!supabase) return;
    
    try {
        const { data: leagueMatches, error: leagueError } = await supabase
            .from('league_matches')
            .select('*')
            .limit(3);
        
        if (leagueError) throw leagueError;
        
        const { data: knockoutMatches, error: knockoutError } = await supabase
            .from('knockout_matches')
            .select('*')
            .limit(3);
        
        if (knockoutError) throw knockoutError;
        
        if (leagueMatches && leagueMatches.length > 0) {
            console.log('📈 عدد مباريات الدوري:', leagueMatches.length);
        }
        
        if (knockoutMatches && knockoutMatches.length > 0) {
            console.log('📈 عدد مباريات الإقصاء:', knockoutMatches.length);
        }
        
    } catch (error) {
        console.error('خطأ في تحميل المباريات:', error);
    }
}

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

    // Tournament modal
    window.addEventListener('click', (event) => {
        if (event.target === tournamentModal) {
            closeTournamentModal();
        }
    });

    // Registration form
    registrationForm?.addEventListener('submit', handleRegistration);

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

function closeTournamentModal() {
    tournamentModal.style.display = 'none';
}


// Registration Functions
async function handleRegistration(e) {
    e.preventDefault();
    
    console.log('📝 محاولة إرسال طلب تسجيل...');
    
    if (!supabase) {
        console.error('❌ قاعدة البيانات غير متصلة');
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
    
    console.log('📋 بيانات التسجيل:', registrationData);

    try {
        const { data, error } = await supabase
            .from('registrations')
            .insert([registrationData]);

        if (error) {
            console.error('❌ خطأ في إدراج البيانات:', error);
            throw error;
        }

        console.log('✅ تم إرسال طلب التسجيل بنجاح');
        showMessage('تم إرسال طلب التسجيل بنجاح! سيتم مراجعته قريباً.', 'success');
        registrationForm.reset();
        
        // Update tournament statuses after new registration
        await updateTournamentStatuses();
        
    } catch (error) {
        console.error('Error submitting registration:', error);
        
        let errorMessage = 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
        if (error.message) {
            errorMessage += '\nالتفاصيل: ' + error.message;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
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
    
    // Handle multiline messages
    if (text.includes('\n')) {
        const lines = text.split('\n');
        message.innerHTML = lines.map(line => `<div>${line}</div>`).join('');
    } else {
        message.textContent = text;
    }

    // Insert message at the top of the page
    document.body.appendChild(message);
    
    // Position message
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '9999';
    message.style.maxWidth = '400px';
    message.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

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
