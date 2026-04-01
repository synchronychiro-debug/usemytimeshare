// ResultsViewModel.swift
// Provides final standings and stake resolution for the Results screen.

import Foundation

@Observable
final class ResultsViewModel {

    let challenge: Challenge

    init(challenge: Challenge) {
        self.challenge = challenge
    }

    // MARK: - Standings

    /// Members sorted from lowest to highest average — winner first.
    var rankedMembers: [ChallengeMember] {
        challenge.members.sorted { $0.currentAvgMinutes < $1.currentAvgMinutes }
    }

    var winner: ChallengeMember? { rankedMembers.first }
    var loser: ChallengeMember?  { rankedMembers.last }

    /// True when there are at least two members with score data to compare.
    var hasResults: Bool {
        challenge.members.filter { !$0.snapshots.isEmpty }.count >= 2
    }

    /// Margin between winner and runner-up, formatted.
    var marginLabel: String? {
        guard rankedMembers.count >= 2 else { return nil }
        let diff = rankedMembers[1].currentAvgMinutes - rankedMembers[0].currentAvgMinutes
        return "\(ChallengeMember.format(minutes: diff)) less screen time"
    }
}
