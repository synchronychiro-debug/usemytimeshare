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
    case challengeDetail(Challenge)
    case results(Challenge)
}

// MARK: - Tab
/// The four main tabs of the authenticated app.
enum AppTab: Int, CaseIterable {
    case home
    case compete
    case friends
    case profile

    var title: String {
        switch self {
        case .home:    return "Home"
        case .compete: return "Compete"
        case .friends: return "Friends"
        case .profile: return "Profile"
        }
    }

    var icon: String {
        switch self {
        case .home:    return "house.fill"
        case .compete: return "trophy.fill"
        case .friends: return "person.2.fill"
        case .profile: return "person.fill"
        }
    }
}

// MARK: - AppRouter
/// Observable router for authenticated navigation.
/// Uses @Observable (iOS 17+) so views re-render only when needed.
@Observable
final class AppRouter {

    // MARK: State
    var path = NavigationPath()       // Home tab navigation stack
    var selectedTab: AppTab = .home
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
