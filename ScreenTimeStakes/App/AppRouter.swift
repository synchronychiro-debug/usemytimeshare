// AppRouter.swift
// Central navigation state for the authenticated app.
// Injected via @Environment(AppRouter.self) throughout the view hierarchy.

import SwiftUI

// MARK: - Pre-auth route enum (used by AuthFlowView)
/// Destinations available before the user has signed in.
enum AuthRoute: Hashable {
    case signIn
    case permissions
}

// MARK: - Post-auth route enum
/// Destinations available once the user is authenticated.
enum AppRoute: Hashable {
    case createChallenge
    case joinChallenge
    case challengeDetail(Challenge)
    case results(Challenge)
}

// MARK: - AppRouter
/// Observable router for authenticated navigation.
/// Uses @Observable (iOS 17+) so views re-render only when needed.
@Observable
final class AppRouter {

    // MARK: State
    var path = NavigationPath()
    var isAuthenticated: Bool = false
    var currentUser: User?

    // MARK: Navigation
    func navigate(to route: AppRoute) {
        path.append(route)
    }

    func pop() {
        guard !path.isEmpty else { return }
        path.removeLast()
    }

    func popToRoot() {
        path = NavigationPath()
    }

    // MARK: Auth helpers
    /// Call after successful sign-in to switch to the main app.
    func signIn(user: User) {
        currentUser = user
        isAuthenticated = true
        path = NavigationPath()
    }

    /// Signs out and returns to the welcome screen.
    func signOut() {
        currentUser = nil
        isAuthenticated = false
        path = NavigationPath()
    }
}
