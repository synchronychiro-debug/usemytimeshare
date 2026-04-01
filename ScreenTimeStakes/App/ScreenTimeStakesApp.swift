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
/// Houses the post-auth NavigationStack: Home and all challenge screens.
struct MainNavigationView: View {

    @Environment(AppRouter.self) private var router

    var body: some View {
        @Bindable var router = router
        NavigationStack(path: $router.path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .createChallenge:
                        CreateChallengeView()
                    case .joinChallenge:
                        JoinChallengeView()
                    case .challengeDetail(let challenge):
                        ChallengeDetailView(challenge: challenge)
                    case .results(let challenge):
                        ResultsView(challenge: challenge)
                    }
                }
        }
    }
}
