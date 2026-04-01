// ChallengeMember.swift
// One participant inside a Challenge.

import Foundation

struct ChallengeMember: Identifiable, Codable, Hashable {

    let id: UUID
    let userId: UUID
    var displayName: String
    var snapshots: [ScoreSnapshot]

    // MARK: Computed

    /// Average daily screen time in minutes across all recorded snapshots.
    var currentAvgMinutes: Int {
        guard !snapshots.isEmpty else { return 0 }
        let total = snapshots.reduce(0) { $0 + $1.dailyMinutes }
        return total / snapshots.count
    }

    /// Human-readable average, e.g. "1h 23m" or "45m".
    var formattedAvg: String {
        Self.format(minutes: currentAvgMinutes)
    }

    /// Two-letter initials for avatar display.
    var initials: String {
        let parts = displayName.split(separator: " ")
        if parts.count >= 2 {
            return (String(parts[0].prefix(1)) + String(parts[1].prefix(1))).uppercased()
        }
        return String(displayName.prefix(2)).uppercased()
    }

    // MARK: Helpers

    static func format(minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        if h > 0 { return "\(h)h \(m)m" }
        return "\(m)m"
    }

    // Hashable / Equatable by id
    static func == (lhs: ChallengeMember, rhs: ChallengeMember) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
