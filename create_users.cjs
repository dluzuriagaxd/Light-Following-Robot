const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yaoxscygxtafbfismerj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhb3hzY3lneHRhZmJmaXNtZXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDk3MDYsImV4cCI6MjA5Nzg4NTcwNn0.1IT-DcutvwpuuKyEmer7Mdo0M37BzBmcTGkRvsuHWyo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUpUsers() {
    const users = [
        { email: 'dluzuriaga@copol.edu.ec', password: 'Copol2026!', meta: { full_name: 'Profesor Luzuriaga' } },
        { email: 'd.luzuriaga@copol.edu.ec', password: 'Copol2026!', meta: { full_name: 'Estudiante Luzuriaga' } },
        { email: 'dluzuriaga593@gmail.com', password: 'Copol2026!', meta: { full_name: 'Admin Luzuriaga' } },
    ];

    for (const u of users) {
        const { data, error } = await supabase.auth.signUp({
            email: u.email,
            password: u.password,
            options: { data: u.meta }
        });
        if (error) {
            console.error('Error signing up', u.email, error.message);
        } else {
            console.log('Signed up', u.email);
        }
    }
}

signUpUsers();
