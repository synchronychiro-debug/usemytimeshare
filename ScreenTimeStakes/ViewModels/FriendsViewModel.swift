// FriendsViewModel.swift
// Manages the friends list — people you've competed with or invited.

import Foundation

/// A friend entry derived from shared challenge history.
struct Friend: Identifiable {
    let id: UUID
    let displayName: String
    let phoneNumber: String
    var challengesPlayed: Int
    var winsAgainstYou: Int      // how many times they beat you
    var lossesAgainstYou: Int    // how many times you beat them

    var initials: String {
        let parts = displayName.split(separator: " ")
        if parts.count >= 2 {
            return (String(parts[0].prefix(1)) + String(parts[1].prefix(1))).uppercased()
        }
        return String(displayName.prefix(2)).uppercased()
    }

    var record: String { "\(lossesAgainstYou)W – \(winsAgainstYou)L" }
}

@Observable
final class FriendsViewModel {

    var friends: [Friend] = []
    var searchText: String = ""
    var isLoading: Bool = false

    var filteredFriends: [Friend] {
        guard !searchText.isEmpty else { return friends }
        return friends.filter {
            $0.displayName.localizedCaseInsensitiveContains(searchText)
        }
    }

    /// Load friends derived from challenge history.
    /// In production this will query the backend for co-participants.
    func loadFriends(currentUserId: UUID) {
        // Mock: derive friends from preview challenge data
        let allMembers = PreviewData.challenges
            .flatMap { $0.members }
            .filter { $0.userId != currentUserId }

        // Deduplicate by userId
        var seen = Set<UUID>()
        let unique = allMembers.filter { seen.insert($0.userId).inserted }

        friends = unique.map { member in
            Friend(
                id: member.userId,
                displayName: member.displayName,
                phoneNumber: "",
                challengesPlayed: Int.random(in: 1...8),
                winsAgainstYou: Int.random(in: 0...4),
                lossesAgainstYou: Int.random(in: 0...4)
            )
        }
    }
}
