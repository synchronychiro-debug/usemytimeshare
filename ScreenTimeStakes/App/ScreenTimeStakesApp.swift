// ScreenTimeStakesApp.swift
// Entry point for the ScreenTimeStakes app.
// Injects the shared AppRouter into the environment so every view can navigate.

import SwiftUI

@main
struct ScreenTimeStakesApp: App {

    @State private var router = AppRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
        }
    }
}

// MARK: - RootView
/// Switches between the unauthenticated flow and the main app based on auth state.
struct RootView: View {

    @Environment(AppRouter.self) private var router

    var body: some View {
        if router.isAuthenticated {
            MainNavigationView()
        } else {
            AuthFlowView()
        }
    }
}

// MARK: - AuthFlowView
/// Houses the pre-auth navigation stack: Welcome → SignIn → Permissions.
struct AuthFlowView: View {

    @Environment(AppRouter.self) private var router
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            WelcomeView(path: $path)
                .navigationDestination(for: AuthRoute.self) { route in
                    switch route {
                    case .signIn:
                        SignInView(path: $path)
                    case .permissions:
                        PermissionsView()
                    }
                }
        }
    }
}

// MARK: - MainNavigationView
/// Tab bar container for the authenticated app.
struct MainNavigationView: View {

    @Environment(AppRouter.self) private var router

    var body: some View {
        @Bindable var router = router
        TabView(selection: $router.selectedTab) {

            // MARK: Home tab
            NavigationStack(path: $router.path) {
                HomeView()
                    .navigationDestination(for: AppRoute.self) { route in
                        switch route {
                        case .challengeDetail(let challenge):
                            ChallengeDetailView(challenge: challenge)
                        case .results(let challenge):
                            ResultsView(challenge: challenge)
                        }
                    }
            }
            .tabItem { Label("Home", systemImage: "house.fill") }
            .tag(AppTab.home)

            // MARK: Compete tab
            NavigationStack {
                CompeteView()
            }
            .tabItem { Label("Compete", systemImage: "trophy.fill") }
            .tag(AppTab.compete)

            // MARK: Friends tab
            NavigationStack {
                FriendsView()
            }
            .tabItem { Label("Friends", systemImage: "person.2.fill") }
            .tag(AppTab.friends)

            // MARK: Profile tab
            NavigationStack {
                ProfileView()
            }
            .tabItem { Label("Profile", systemImage: "person.fill") }
            .tag(AppTab.profile)
        }
    }
}
