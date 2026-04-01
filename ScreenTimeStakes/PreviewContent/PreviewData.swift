// PreviewData.swift
// Static mock objects used by Xcode Previews and the mock services.
// All IDs are fixed so Previews are stable across rebuilds.

import Foundation

enum PreviewData {

    // MARK: - Users

    static let alice = User(
        id: UUID(uuidString: "A0000000-0000-0000-0000-000000000001")!,
        phoneNumber: "+15550001111",
        displayName: "Alice Kim"
    )

    static let bob = User(
        id: UUID(uuidString: "B0000000-0000-0000-0000-000000000002")!,
        phoneNumber: "+15550002222",
        displayName: "Bob Chen"
    )

    static let carol = User(
        id: UUID(uuidString: "C0000000-0000-0000-0000-000000000003")!,
        phoneNumber: "+15550003333",
        displayName: "Carol Day"
    )

    // MARK: - Score Snapshots

    static let aliceSnapshots: [ScoreSnapshot] = stride(from: 6, through: 0, by: -1).map { daysAgo in
        ScoreSnapshot(
            id: UUID(),
            memberId: UUID(uuidString: "AA000000-0000-0000-0000-000000000001")!,
            recordedAt: .daysAgo(daysAgo),
            dailyMinutes: [95, 80, 110, 75, 90, 65, 55][6 - daysAgo]
        )
    }

    static let bobSnapshots: [ScoreSnapshot] = stride(from: 6, through: 0, by: -1).map { daysAgo in
        ScoreSnapshot(
            id: UUID(),
            memberId: UUID(uuidString: "BB000000-0000-0000-0000-000000000002")!,
            recordedAt: .daysAgo(daysAgo),
            dailyMinutes: [180, 150, 200, 130, 160, 145, 120][6 - daysAgo]
        )
    }

    static let carolSnapshots: [ScoreSnapshot] = stride(from: 6, through: 0, by: -1).map { daysAgo in
        ScoreSnapshot(
            id: UUID(),
            memberId: UUID(uuidString: "CC000000-0000-0000-0000-000000000003")!,
            recordedAt: .daysAgo(daysAgo),
            dailyMinutes: [210, 190, 230, 175, 195, 185, 160][6 - daysAgo]
        )
    }

    // MARK: - Members

    static let memberAlice = ChallengeMember(
        id: UUID(uuidString: "AA000000-0000-0000-0000-000000000001")!,
        userId: alice.id,
        displayName: alice.displayName,
        snapshots: aliceSnapshots
    )

    static let memberBob = ChallengeMember(
        id: UUID(uuidString: "BB000000-0000-0000-0000-000000000002")!,
        userId: bob.id,
        displayName: bob.displayName,
        snapshots: bobSnapshots
    )

    static let memberCarol = ChallengeMember(
        id: UUID(uuidString: "CC000000-0000-0000-0000-000000000003")!,
        userId: carol.id,
        displayName: carol.displayName,
        snapshots: carolSnapshots
    )

    // MARK: - Challenges

    /// A multi-member, currently active weekly challenge.
    static let activeChallenge = Challenge(
        id: UUID(uuidString: "D0000000-0000-0000-0000-000000000004")!,
        title: "Weekly Detox",
        stake: "Loser does dishes every day next week",
        period: .weekly,
        status: .active,
        startDate: .daysAgo(3),
        endDate: .daysFromNow(4),
        inviteCode: "WKD-42",
        creatorId: alice.id,
        members: [memberAlice, memberBob]
    )

    /// A completed challenge — ready to show results.
    static let completedChallenge = Challenge(
        id: UUID(uuidString: "E0000000-0000-0000-0000-000000000005")!,
        title: "Weekend Hustle",
        stake: "Loser buys coffee for a month",
        period: .daily,
        status: .completed,
        startDate: .daysAgo(8),
        endDate: .daysAgo(7),
        inviteCode: "WKD-10",
        creatorId: bob.id,
        members: [memberAlice, memberBob, memberCarol]
    )

    /// A pending challenge waiting for more players.
    static let pendingChallenge = Challenge(
        id: UUID(uuidString: "F0000000-0000-0000-0000-000000000006")!,
        title: "No-Phone Dinner",
        stake: "Loser cooks dinner for a week",
        period: .daily,
        status: .pending,
        startDate: .daysFromNow(1),
        endDate: .daysFromNow(2),
        inviteCode: "NPD-99",
        creatorId: carol.id,
        members: [memberCarol]
    )

    static let challenges: [Challenge] = [activeChallenge, completedChallenge, pendingChallenge]
}

// MARK: - Date Helpers
extension Date {
    /// N days before today (positive = past).
    static func daysAgo(_ n: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: -n, to: Date())!
    }

    /// N days after today.
    static func daysFromNow(_ n: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: n, to: Date())!
    }
}
