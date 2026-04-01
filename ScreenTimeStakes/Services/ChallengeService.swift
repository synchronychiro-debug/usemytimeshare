// ChallengeService.swift
// Mock challenge persistence and business logic.
// Replace internals with API calls / CloudKit / Supabase in a later version.

import Foundation

// MARK: - Errors
enum ChallengeError: LocalizedError {
    case invalidInviteCode
    case challengeNotFound
    case alreadyMember
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .invalidInviteCode:  return "That invite code is not valid."
        case .challengeNotFound:  return "Challenge not found."
        case .alreadyMember:      return "You're already in this challenge."
        case .unknown(let msg):   return msg
        }
    }
}

// MARK: - ChallengeService
/// Singleton mock data store for challenges.
@Observable
final class ChallengeService {

    static let shared = ChallengeService()
    private init() {}

    // In-memory store seeded with preview data so the UI is never empty.
    private var store: [Challenge] = PreviewData.challenges

    // MARK: - Fetch

    /// Returns all challenges that include the given userId as a member.
    func fetchMyChallenges(for userId: UUID) async throws -> [Challenge] {
        try await Task.sleep(for: .milliseconds(500))
        return store.filter { $0.members.contains { $0.userId == userId } }
    }

    /// Returns a single challenge by id.
    func fetchChallenge(id: UUID) async throws -> Challenge {
        try await Task.sleep(for: .milliseconds(200))
        guard let challenge = store.first(where: { $0.id == id }) else {
            throw ChallengeError.challengeNotFound
        }
        return challenge
    }

    // MARK: - Create

    /// Creates a new challenge and adds it to the store.
    func createChallenge(
        title: String,
        stake: String,
        period: ChallengePeriod,
        creator: User
    ) async throws -> Challenge {
        try await Task.sleep(for: .milliseconds(400))

        let now = Date()
        let end: Date = period == .daily
            ? Calendar.current.date(byAdding: .day,        value: 1, to: now)!
            : Calendar.current.date(byAdding: .weekOfYear, value: 1, to: now)!

        let creatorMember = ChallengeMember(
            id: UUID(),
            userId: creator.id,
            displayName: creator.displayName,
            snapshots: []
        )

        // Generate a short, readable invite code
        let code = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(6)).uppercased()

        var challenge = Challenge(
            id: UUID(),
            title: title,
            stake: stake,
            period: period,
            status: .pending,
            startDate: now,
            endDate: end,
            inviteCode: code,
            creatorId: creator.id,
            members: [creatorMember]
        )
        store.append(challenge)
        return challenge
    }

    // MARK: - Join

    /// Joins an existing challenge using an invite code.
    func joinChallenge(inviteCode: String, user: User) async throws -> Challenge {
        try await Task.sleep(for: .milliseconds(400))

        guard let index = store.firstIndex(where: {
            $0.inviteCode.uppercased() == inviteCode.uppercased()
        }) else {
            throw ChallengeError.invalidInviteCode
        }

        guard !store[index].members.contains(where: { $0.userId == user.id }) else {
            throw ChallengeError.alreadyMember
        }

        let newMember = ChallengeMember(
            id: UUID(),
            userId: user.id,
            displayName: user.displayName,
            snapshots: []
        )
        store[index].members.append(newMember)
        return store[index]
    }
}
