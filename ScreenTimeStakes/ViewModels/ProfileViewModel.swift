// ProfileViewModel.swift
// Drives the Profile screen — user stats and settings.

import Foundation

@Observable
final class ProfileViewModel {

    var totalChallenges: Int = 0
    var wins: Int = 0
    var currentStreak: Int = 0   // consecutive days under avg screen time

    /// Derive stats from challenge history for the given user.
    func loadStats(for userId: UUID) {
        let myChallenges = PreviewData.challenges.filter {
            $0.members.contains { $0.userId == userId }
        }
        totalChallenges = myChallenges.count

        wins = myChallenges.filter { challenge in
            guard challenge.status == .completed else { return false }
            let ranked = challenge.members.sorted { $0.currentAvgMinutes < $1.currentAvgMinutes }
            return ranked.first?.userId == userId
        }.count

        // Mock streak — will come from real snapshot data later
        currentStreak = 3
    }
}
