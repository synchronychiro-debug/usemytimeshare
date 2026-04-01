// HomeViewModel.swift
// Loads and organises the current user's challenges for the Home screen.

import Foundation

@Observable
final class HomeViewModel {

    // MARK: - State
    var challenges: [Challenge] = []
    var isLoading: Bool = false
    var hasLoaded: Bool = false
    var errorMessage: String?

    private let service = ChallengeService.shared

    // MARK: - Filtered Lists

    var activeChallenges: [Challenge] {
        challenges.filter { $0.status == .active }
    }

    var pendingChallenges: [Challenge] {
        challenges.filter { $0.status == .pending }
    }

    var completedChallenges: [Challenge] {
        challenges.filter { $0.status == .completed }
    }

    // MARK: - Actions

    func loadChallenges(for userId: UUID) async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        do {
            challenges = try await service.fetchMyChallenges(for: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
        hasLoaded = true
    }
}
