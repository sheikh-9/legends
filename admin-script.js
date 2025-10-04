// Supabase Configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Initialize Supabase client
let supabase;

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'fifa2026admin'
};

// Global variables
let isAdminLoggedIn = false;
let currentFilter = 'pending';
let currentMatchTab = 'league';
let currentParticipantTab = 'league';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if Supabase is configured
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
        SUPABASE_URL === 'https://your-project-id.supabase.co' || 
        SUPABASE_ANON_KEY === 'your-anon-key-here') {
        console.warn('Supabase not configured. Please set up your environment variables.');
        showMessage('يرجى إعداد قاعدة البيانات أولاً', 'error');
        return;
    }
    
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase connected successfully');
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showMessage('خطأ في الاتصال بقاعدة البيانات', 'error');
    }
    
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('adminLoginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchSection(item.dataset.section));
    });
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => switchFilter(tab.dataset.status));
    });
    
    // Match tabs
    document.querySelectorAll('.match-tab').forEach(tab => {
        tab.addEventListener('click', () => switchMatchTab(tab.dataset.tournament));
    });
    
    // Participant tabs
    document.querySelectorAll('.participant-tab').forEach(tab => {
        tab.addEventListener('click', () => switchParticipantTab(tab.dataset.tournament));
    });
    
    // Add match form
    document.getElementById('addMatchForm').addEventListener('submit', handleAddMatch);
    
    // Modal close events
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('addMatchModal');
        if (event.target === modal) {
            closeAddMatchModal();
        }
    });
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAdminLoggedIn = true;
        showDashboard();
        loadDashboardData();
        showMessage('تم تسجيل الدخول بنجاح', 'success');
    } else {
        showMessage('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
}

function handleLogout() {
    isAdminLoggedIn = false;
    showLoginScreen();
    showMessage('تم تسجيل الخروج بنجاح', 'success');
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'grid';
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminLoginForm').reset();
}

// Navigation Functions
function switchSection(sectionName) {
    // Update sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    // Load section data
    loadSectionData(sectionName);
}

function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'registrations':
            loadRegistrations();
            break;
        case 'tournaments':
            loadTournamentStats();
            break;
        case 'matches':
            loadMatches();
            break;
        case 'standings':
            loadStandings();
            break;
        case 'participants':
            loadParticipants();
            break;
    }
}

// Dashboard Data Loading
async function loadDashboardData() {
    if (!supabase) return;
    
    try {
        // Load overview data
        await loadOverviewData();
        
        // Load registrations
        await loadRegistrations();
        
        // Update pending badge
        await updatePendingBadge();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('خطأ في تحميل البيانات', 'error');
    }
}

async function loadOverviewData() {
    if (!supabase) return;
    
    try {
        // Get total registrations
        const { data: totalRegs, error: totalError } = await supabase
            .from('registrations')
            .select('id');
        
        if (totalError) throw totalError;
        
        // Get pending registrations
        const { data: pendingRegs, error: pendingError } = await supabase
            .from('registrations')
            .select('id')
            .eq('status', 'pending');
        
        if (pendingError) throw pendingError;
        
        // Get total matches
        const { data: leagueMatches, error: leagueError } = await supabase
            .from('league_matches')
            .select('id');
        
        const { data: knockoutMatches, error: knockoutError } = await supabase
            .from('knockout_matches')
            .select('id');
        
        if (leagueError) throw leagueError;
        if (knockoutError) throw knockoutError;
        
        // Update stats
        document.getElementById('totalRegistrations').textContent = totalRegs?.length || 0;
        document.getElementById('pendingRegistrations').textContent = pendingRegs?.length || 0;
        document.getElementById('totalMatches').textContent = (leagueMatches?.length || 0) + (knockoutMatches?.length || 0);
        
        // Load registration chart
        await loadRegistrationChart();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

async function loadRegistrationChart() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('tournament_type')
            .eq('status', 'approved');
        
        if (error) throw error;
        
        const counts = {
            league: 0,
            online: 0,
            offline: 0
        };
        
        data?.forEach(reg => {
            counts[reg.tournament_type] = (counts[reg.tournament_type] || 0) + 1;
        });
        
        const chartContainer = document.getElementById('registrationChart');
        chartContainer.innerHTML = `
            <div class="chart-bars">
                <div class="chart-bar">
                    <div class="bar-label">الدوري</div>
                    <div class="bar-container">
                        <div class="bar" style="height: ${(counts.league / 16) * 100}%"></div>
                    </div>
                    <div class="bar-value">${counts.league}/16</div>
                </div>
                <div class="chart-bar">
                    <div class="bar-label">الرقمي</div>
                    <div class="bar-container">
                        <div class="bar" style="height: ${(counts.online / 32) * 100}%"></div>
                    </div>
                    <div class="bar-value">${counts.online}/32</div>
                </div>
                <div class="chart-bar">
                    <div class="bar-label">الحضوري</div>
                    <div class="bar-container">
                        <div class="bar" style="height: ${(counts.offline / 16) * 100}%"></div>
                    </div>
                    <div class="bar-value">${counts.offline}/16</div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading registration chart:', error);
    }
}

async function loadRecentActivity() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const activityContainer = document.getElementById('recentActivity');
        
        if (!data || data.length === 0) {
            activityContainer.innerHTML = '<p style="text-align: center; color: #666;">لا توجد أنشطة حديثة</p>';
            return;
        }
        
        activityContainer.innerHTML = data.map(reg => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="activity-info">
                    <h4>تسجيل جديد: ${reg.player_name}</h4>
                    <p>${getTournamentName(reg.tournament_type)} - ${getStatusName(reg.status)}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Registration Management
function switchFilter(status) {
    currentFilter = status;
    
    // Update tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    
    // Load filtered registrations
    loadRegistrations();
}

async function loadRegistrations() {
    if (!supabase) return;
    
    try {
        let query = supabase.from('registrations').select('*').order('created_at', { ascending: false });
        
        if (currentFilter !== 'all') {
            query = query.eq('status', currentFilter);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        displayRegistrations(data || []);
        
    } catch (error) {
        console.error('Error loading registrations:', error);
        showMessage('خطأ في تحميل طلبات التسجيل', 'error');
    }
}

function displayRegistrations(registrations) {
    const container = document.getElementById('registrationsList');
    
    if (registrations.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">لا توجد طلبات تسجيل</p>';
        return;
    }
    
    container.innerHTML = registrations.map(reg => `
        <div class="registration-card">
            <div class="registration-header">
                <div class="registration-name">${reg.player_name}</div>
                <div class="registration-status ${reg.status}">${getStatusName(reg.status)}</div>
            </div>
            <div class="registration-info">
                <div class="info-item">
                    <div class="info-label">البريد الإلكتروني</div>
                    <div class="info-value">${reg.email}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">رقم الهاتف</div>
                    <div class="info-value">${reg.phone}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">البطولة</div>
                    <div class="info-value">${getTournamentName(reg.tournament_type)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">مستوى الخبرة</div>
                    <div class="info-value">${getExperienceName(reg.experience_level)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">تاريخ التسجيل</div>
                    <div class="info-value">${new Date(reg.created_at).toLocaleDateString('ar-SA')}</div>
                </div>
            </div>
            ${reg.status === 'pending' ? `
                <div class="registration-actions">
                    <button class="btn btn-success" onclick="approveRegistration('${reg.id}')">
                        <i class="fas fa-check"></i> موافقة
                    </button>
                    <button class="btn btn-danger" onclick="rejectRegistration('${reg.id}')">
                        <i class="fas fa-times"></i> رفض
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function approveRegistration(id) {
    if (!supabase || !isAdminLoggedIn) return;
    
    try {
        const { error } = await supabase
            .from('registrations')
            .update({ status: 'approved' })
            .eq('id', id);
        
        if (error) throw error;
        
        showMessage('تم قبول طلب التسجيل بنجاح', 'success');
        loadRegistrations();
        updatePendingBadge();
        
    } catch (error) {
        console.error('Error approving registration:', error);
        showMessage('خطأ في قبول الطلب', 'error');
    }
}

async function rejectRegistration(id) {
    if (!supabase || !isAdminLoggedIn) return;
    
    try {
        const { error } = await supabase
            .from('registrations')
            .update({ status: 'rejected' })
            .eq('id', id);
        
        if (error) throw error;
        
        showMessage('تم رفض طلب التسجيل', 'success');
        loadRegistrations();
        updatePendingBadge();
        
    } catch (error) {
        console.error('Error rejecting registration:', error);
        showMessage('خطأ في رفض الطلب', 'error');
    }
}

async function updatePendingBadge() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('id')
            .eq('status', 'pending');
        
        if (error) throw error;
        
        const badge = document.getElementById('pendingBadge');
        const count = data?.length || 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
        
    } catch (error) {
        console.error('Error updating pending badge:', error);
    }
}

// Tournament Management
async function loadTournamentStats() {
    if (!supabase) return;
    
    try {
        // Get registration counts for each tournament
        const { data: registrations, error } = await supabase
            .from('registrations')
            .select('tournament_type')
            .eq('status', 'approved');
        
        if (error) throw error;
        
        const counts = {
            league: 0,
            online: 0,
            offline: 0
        };
        
        registrations?.forEach(reg => {
            counts[reg.tournament_type] = (counts[reg.tournament_type] || 0) + 1;
        });
        
        // Get match counts
        const { data: leagueMatches } = await supabase.from('league_matches').select('id');
        const { data: onlineMatches } = await supabase.from('knockout_matches').select('id').eq('tournament_type', 'online');
        const { data: offlineMatches } = await supabase.from('knockout_matches').select('id').eq('tournament_type', 'offline');
        
        // Update tournament cards
        document.getElementById('leagueParticipants').textContent = `${counts.league}/16`;
        document.getElementById('leagueMatches').textContent = leagueMatches?.length || 0;
        
        document.getElementById('onlineParticipants').textContent = `${counts.online}/32`;
        document.getElementById('onlineMatches').textContent = onlineMatches?.length || 0;
        
        document.getElementById('offlineParticipants').textContent = `${counts.offline}/16`;
        document.getElementById('offlineMatches').textContent = offlineMatches?.length || 0;
        
        // Update status badges
        updateTournamentStatus('league', counts.league, 16);
        updateTournamentStatus('online', counts.online, 32);
        updateTournamentStatus('offline', counts.offline, 16);
        
    } catch (error) {
        console.error('Error loading tournament stats:', error);
    }
}

function updateTournamentStatus(type, current, max) {
    const statusElement = document.getElementById(`${type}Status`);
    
    if (current >= max) {
        statusElement.textContent = 'مغلق';
        statusElement.className = 'status-badge closed';
    } else if (current > 0) {
        statusElement.textContent = 'جاري اللعب';
        statusElement.className = 'status-badge playing';
    } else {
        statusElement.textContent = 'مفتوح';
        statusElement.className = 'status-badge open';
    }
}

function manageTournament(type) {
    // Switch to matches section and filter by tournament type
    switchSection('matches');
    switchMatchTab(type);
}

// Match Management
function switchMatchTab(tournament) {
    currentMatchTab = tournament;
    
    // Update tabs
    document.querySelectorAll('.match-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tournament="${tournament}"]`).classList.add('active');
    
    // Load matches
    loadMatches();
}

async function loadMatches() {
    if (!supabase) return;
    
    try {
        let data, error;
        
        if (currentMatchTab === 'league') {
            ({ data, error } = await supabase
                .from('league_matches')
                .select('*')
                .order('match_date', { ascending: false }));
        } else {
            ({ data, error } = await supabase
                .from('knockout_matches')
                .select('*')
                .eq('tournament_type', currentMatchTab)
                .order('match_date', { ascending: false }));
        }
        
        if (error) throw error;
        
        displayMatches(data || []);
        
    } catch (error) {
        console.error('Error loading matches:', error);
        showMessage('خطأ في تحميل المباريات', 'error');
    }
}

function displayMatches(matches) {
    const container = document.getElementById('matchesList');
    
    if (matches.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">لا توجد مباريات</p>';
        return;
    }
    
    container.innerHTML = matches.map(match => `
        <div class="match-card">
            <div class="match-info">
                <div class="match-teams">${match.team1_name} VS ${match.team2_name}</div>
                <div class="match-score">
                    ${match.team1_score !== null ? `${match.team1_score} - ${match.team2_score}` : 'لم تحدد النتيجة'}
                </div>
                <div class="match-date">${new Date(match.match_date).toLocaleDateString('ar-SA')}</div>
            </div>
            <div class="match-actions">
                <button class="btn btn-warning" onclick="editMatch('${match.id}', '${currentMatchTab}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger" onclick="deleteMatch('${match.id}', '${currentMatchTab}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function showAddMatchModal() {
    document.getElementById('addMatchModal').style.display = 'block';
    // Set current tournament as default
    document.getElementById('matchTournament').value = currentMatchTab;
}

function closeAddMatchModal() {
    document.getElementById('addMatchModal').style.display = 'none';
    document.getElementById('addMatchForm').reset();
}

async function handleAddMatch(e) {
    e.preventDefault();
    
    if (!supabase || !isAdminLoggedIn) return;
    
    const formData = new FormData(e.target);
    const matchData = {
        team1_name: formData.get('team1'),
        team2_name: formData.get('team2'),
        team1_score: parseInt(formData.get('score1')),
        team2_score: parseInt(formData.get('score2')),
        match_date: formData.get('matchDate') || new Date().toISOString()
    };
    
    const tournament = formData.get('matchTournament');
    
    try {
        if (tournament === 'league') {
            const { error } = await supabase
                .from('league_matches')
                .insert([matchData]);
            
            if (error) throw error;
            
            // Update league standings
            await updateLeagueStandings(matchData.team1_name, matchData.team2_name, matchData.team1_score, matchData.team2_score);
        } else {
            matchData.tournament_type = tournament;
            matchData.round = 1; // Default round
            
            const { error } = await supabase
                .from('knockout_matches')
                .insert([matchData]);
            
            if (error) throw error;
        }
        
        showMessage('تم إضافة المباراة بنجاح', 'success');
        closeAddMatchModal();
        loadMatches();
        
    } catch (error) {
        console.error('Error adding match:', error);
        showMessage('خطأ في إضافة المباراة', 'error');
    }
}

async function editMatch(matchId, matchType) {
    if (!isAdminLoggedIn) return;
    
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
            loadMatches();
            
            if (matchType === 'league') {
                await recalculateLeagueStandings();
            }
            
        } catch (error) {
            console.error('Error updating match:', error);
            showMessage('خطأ في تحديث المباراة', 'error');
        }
    }
}

async function deleteMatch(matchId, matchType) {
    if (!isAdminLoggedIn) return;
    
    if (!confirm('هل أنت متأكد من حذف هذه المباراة؟')) return;
    
    try {
        const tableName = matchType === 'league' ? 'league_matches' : 'knockout_matches';
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', matchId);
        
        if (error) throw error;
        
        showMessage('تم حذف المباراة بنجاح', 'success');
        loadMatches();
        
        if (matchType === 'league') {
            await recalculateLeagueStandings();
        }
        
    } catch (error) {
        console.error('Error deleting match:', error);
        showMessage('خطأ في حذف المباراة', 'error');
    }
}

// League Standings Management
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
        const wins = points === 3 ? existing.wins + 1 : existing.wins;
        const draws = points === 1 ? existing.draws + 1 : existing.draws;
        const losses = points === 0 ? existing.losses + 1 : existing.losses;
        
        const { error: updateError } = await supabase
            .from('league_standings')
            .update({
                matches_played: existing.matches_played + 1,
                wins: wins,
                draws: draws,
                losses: losses,
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
                wins: points === 3 ? 1 : 0,
                draws: points === 1 ? 1 : 0,
                losses: points === 0 ? 1 : 0,
                points: points,
                goals_for: goalsFor,
                goals_against: goalsAgainst,
                goal_difference: goalsFor - goalsAgainst
            }]);
        
        if (insertError) throw insertError;
    }
}

async function recalculateLeagueStandings() {
    try {
        // Clear current standings
        const { error: deleteError } = await supabase
            .from('league_standings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
            console.log('Delete error (expected):', deleteError);
        }
        
        // Recalculate from all matches
        const { data: matches, error } = await supabase
            .from('league_matches')
            .select('*');
        
        if (error) throw error;
        
        const standings = {};
        
        matches?.forEach(match => {
            if (match.team1_score !== null && match.team2_score !== null) {
                // Initialize teams if not exists
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
                
                // Update team1 stats
                standings[match.team1_name].matches_played++;
                standings[match.team1_name].goals_for += match.team1_score;
                standings[match.team1_name].goals_against += match.team2_score;
                
                // Update team2 stats
                standings[match.team2_name].matches_played++;
                standings[match.team2_name].goals_for += match.team2_score;
                standings[match.team2_name].goals_against += match.team1_score;
                
                // Determine result and points
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
                
                // Calculate goal difference
                standings[match.team1_name].goal_difference = 
                    standings[match.team1_name].goals_for - standings[match.team1_name].goals_against;
                standings[match.team2_name].goal_difference = 
                    standings[match.team2_name].goals_for - standings[match.team2_name].goals_against;
            }
        });
        
        // Insert new standings
        const standingsArray = Object.values(standings);
        if (standingsArray.length > 0) {
            const { error: insertError } = await supabase
                .from('league_standings')
                .insert(standingsArray);
            
            if (insertError) throw insertError;
        }
        
        showMessage('تم إعادة حساب الترتيب بنجاح', 'success');
        
    } catch (error) {
        console.error('Error recalculating standings:', error);
        showMessage('خطأ في إعادة حساب الترتيب', 'error');
    }
}

async function loadStandings() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('league_standings')
            .select('*')
            .order('points', { ascending: false })
            .order('goal_difference', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('standingsContent');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">لا توجد بيانات ترتيب</p>';
            return;
        }
        
        container.innerHTML = `
            <table class="standings-table">
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
                            <td class="position">${index + 1}</td>
                            <td class="team-name">${team.team_name}</td>
                            <td>${team.matches_played}</td>
                            <td>${team.wins}</td>
                            <td>${team.draws}</td>
                            <td>${team.losses}</td>
                            <td>${team.goals_for}</td>
                            <td>${team.goals_against}</td>
                            <td>${team.goal_difference > 0 ? '+' : ''}${team.goal_difference}</td>
                            <td class="points">${team.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Error loading standings:', error);
        showMessage('خطأ في تحميل الترتيب', 'error');
    }
}

// Participants Management
function switchParticipantTab(tournament) {
    currentParticipantTab = tournament;
    
    // Update tabs
    document.querySelectorAll('.participant-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tournament="${tournament}"]`).classList.add('active');
    
    // Load participants
    loadParticipants();
}

async function loadParticipants() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('tournament_type', currentParticipantTab)
            .eq('status', 'approved')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        displayParticipants(data || []);
        
    } catch (error) {
        console.error('Error loading participants:', error);
        showMessage('خطأ في تحميل المشاركين', 'error');
    }
}

function displayParticipants(participants) {
    const container = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">لا يوجد مشاركين</p>';
        return;
    }
    
    container.innerHTML = participants.map((participant, index) => `
        <div class="participant-card">
            <div class="participant-name">${participant.player_name}</div>
            <div class="participant-email">${participant.email}</div>
            <div class="participant-status active">مشارك نشط</div>
        </div>
    `).join('');
}

// Utility Functions
function getTournamentName(type) {
    switch (type) {
        case 'league': return 'بطولة الدوري الممتاز';
        case 'online': return 'كأس فيفا الرقمي';
        case 'offline': return 'بطولة الأبطال الحضورية';
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

function getStatusName(status) {
    switch (status) {
        case 'pending': return 'معلق';
        case 'approved': return 'مقبول';
        case 'rejected': return 'مرفوض';
        default: return status;
    }
}

function refreshRegistrations() {
    loadRegistrations();
    updatePendingBadge();
    showMessage('تم تحديث البيانات', 'success');
}

function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert message
    document.body.appendChild(message);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (message && message.parentNode) {
            message.remove();
        }
    }, 5000);
}
