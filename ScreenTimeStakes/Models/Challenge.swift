// Challenge.swift
// Core domain model for a screen-time competition.

import Foundation

// MARK: - ChallengePeriod
/// How long a single round of competition lasts.
enum ChallengePeriod: String, Codable, CaseIterable, Identifiable {
    case daily  = "Daily"
    case weekly = "Weekly"

    var id: String { rawValue }

    /// Human-readable label shown in the UI.
    var displayName: String { rawValue }

    /// Description of what the period means in context.
    var subtitle: String {
        switch self {
        case .daily:  return "Compare screen time for a single day"
        case .weekly: return "Compare 7-day averages"
        }
    }
}

// MARK: - ChallengeStatus
/// Lifecycle state of a challenge.
enum ChallengeStatus: String, Codable {
    case pending   = "Pending"    // Created but not yet started / still waiting for players
    case active    = "Active"     // Scoring window is open
    case completed = "Completed"  // Results are final
}

// MARK: - Challenge
/// A screen-time competition between two or more members.
struct Challenge: Identifiable, Codable, Hashable {

    let id: UUID
    var title: String
    var stake: String           // e.g. "Loser does laundry for a week"
    var period: ChallengePeriod
    var status: ChallengeStatus
    var startDate: Date
    var endDate: Date
    var inviteCode: String      // Short code friends use to join (e.g. "WKD-42")
    var creatorId: UUID
    var members: [ChallengeMember]

    // MARK: Computed
    /// The member with the lowest average daily screen time — currently winning.
    var leader: ChallengeMember? {
        members
            .filter { !$0.snapshots.isEmpty }
            .min(by: { $0.currentAvgMinutes < $1.currentAvgMinutes })
    }

    /// Progress through the challenge window, 0.0–1.0.
    var progressFraction: Double {
        let total = endDate.timeIntervalSince(startDate)
        let elapsed = Date().timeIntervalSince(startDate)
        guard total > 0 else { return 0 }
        return min(1.0, max(0.0, elapsed / total))
    }

    /// Calendar days remaining until endDate.
    var daysRemaining: Int {
        let diff = Calendar.current.dateComponents([.day], from: Date(), to: endDate)
        return max(0, diff.day ?? 0)
    }

    // Hashable / Equatable by id only so Challenge can be used in NavigationPath
    static func == (lhs: Challenge, rhs: Challenge) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
