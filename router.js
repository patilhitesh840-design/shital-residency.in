// Client-side Hash Router for GrandDome SPA
import { authService } from './firebase.js';

export const Router = {
    routes: {},
    currentRoute: null,

    // Register routes
    init(routes) {
        this.routes = routes;
        
        // Listen to hash changes
        window.addEventListener('hashchange', () => this.resolveRoute());
        
        // Initial route check
        this.resolveRoute();
    },

    // Navigate to a hash path programmatically
    navigate(path) {
        window.location.hash = path;
    },

    // Resolve route and enforce auth guards
    resolveRoute() {
        let hash = window.location.hash || '#/login';
        
        // Normalize hash path
        if (!hash.startsWith('#/')) {
            hash = '#/login';
        }

        // Get currently logged-in user
        const currentUser = authService.getCurrentUser();

        // 1. AUTH GUARD: Redirect unauthenticated users to Login
        if (hash !== '#/login' && !currentUser) {
            this.navigate('#/login');
            return;
        }

        // 2. AUTH GUARD: Redirect authenticated users away from Login to their dashboard
        if (hash === '#/login' && currentUser) {
            if (currentUser.role === 'admin') {
                this.navigate('#/admin');
            } else if (currentUser.role === 'resident') {
                this.navigate('#/resident');
            }
            return;
        }

        // 3. ROLE GUARD: Prevent residents from accessing admin pages
        if (hash === '#/admin' && currentUser && currentUser.role !== 'admin') {
            this.navigate('#/resident');
            return;
        }

        // 4. ROLE GUARD: Prevent admins from accessing resident pages
        if (hash === '#/resident' && currentUser && currentUser.role !== 'admin') {
            // Wait, what if admin wants to view a resident profile? Usually they do it inside admin panel.
            // So we restrict resident page strictly to residents.
            if (currentUser.role === 'admin') {
                this.navigate('#/admin');
                return;
            }
        }

        // Load page callback
        const pageRenderer = this.routes[hash];
        if (pageRenderer) {
            this.currentRoute = hash;
            
            // Set active navigation links if applicable
            document.querySelectorAll('.nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href === hash) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Call the renderer
            const appContainer = document.getElementById('app');
            pageRenderer(appContainer);
        } else {
            // 404 - Redirect to login or default
            this.navigate('#/login');
        }
    }
};
