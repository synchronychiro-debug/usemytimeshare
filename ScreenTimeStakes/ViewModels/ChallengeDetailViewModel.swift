// ChallengeDetailViewModel.swift
// Provides derived data for the Challenge Detail screen.

import Foundation

@Observable
final class ChallengeDetailViewModel {

    // MARK: - State
    let challenge: Challenge
    var isLoading: Bool = false

    init(challenge: Challenge) {
        self.challenge = challenge
    }

    // MARK: - Derived Data

    /// Members sorted from lowest to highest average screen time (leaderboard order).
    var rankedMembers: [ChallengeMember] {
        challenge.members.sorted { $0.currentAvgMinutes < $1.currentAvgMinutes }
    }

    /// The current leader (lowest average).
    var leader: ChallengeMember? { rankedMembers.first }

    /// Friendly label for challenge progress.
    var progressLabel: String {
        switch challenge.status {
        case .pending:   return "Waiting to start"
        case .active:    return "\(challenge.daysRemaining)d remaining"
        case .completed: return "Finished"
        }
    }
}
