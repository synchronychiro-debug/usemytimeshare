// ScoreSnapshot.swift
// A single day's screen-time reading for one challenge member.
// In production this will be populated from ScreenTime API data.

import Foundation

struct ScoreSnapshot: Identifiable, Codable, Hashable {

    let id: UUID
    let memberId: UUID
    var recordedAt: Date        // The calendar day this reading represents
    var dailyMinutes: Int       // Total screen time for that day, in minutes

    // MARK: Computed

    /// Human-readable duration, e.g. "2h 10m" or "45m".
    var formattedTime: String {
        ChallengeMember.format(minutes: dailyMinutes)
    }

    /// Short date label for chart axes, e.g. "Mon", "Apr 1".
    var shortDateLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: recordedAt)
    }
}
