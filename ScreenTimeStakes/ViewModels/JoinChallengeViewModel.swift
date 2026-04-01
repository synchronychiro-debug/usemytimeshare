// JoinChallengeViewModel.swift
// Drives the Join Challenge invite-code entry screen.

import Foundation

@Observable
final class JoinChallengeViewModel {

    // MARK: - Form Fields
    var inviteCode: String = ""

    // MARK: - State
    var isLoading: Bool = false
    var errorMessage: String?
    var joinedChallenge: Challenge?

    private let service = ChallengeService.shared

    // MARK: - Validation

    var isCodeValid: Bool {
        inviteCode.trimmingCharacters(in: .whitespaces).count >= 4
    }

    // MARK: - Actions

    /// Attempts to join the challenge identified by `inviteCode`.
    /// Sets `joinedChallenge` on success.
    func join(as user: User) async {
        guard isCodeValid, !isLoading else { return }
        isLoading = true
        errorMessage = nil
        do {
            joinedChallenge = try await service.joinChallenge(
                inviteCode: inviteCode.trimmingCharacters(in: .whitespaces),
                user: user
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
