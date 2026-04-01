// CreateChallengeViewModel.swift
// Drives the Create Challenge form and submission.

import Foundation

@Observable
final class CreateChallengeViewModel {

    // MARK: - Form Fields
    var title: String = ""
    var stake: String = ""
    var period: ChallengePeriod = .weekly

    // MARK: - State
    var isLoading: Bool = false
    var errorMessage: String?
    var createdChallenge: Challenge?

    private let service = ChallengeService.shared

    // MARK: - Validation

    var isFormValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty &&
        !stake.trimmingCharacters(in: .whitespaces).isEmpty
    }

    // MARK: - Actions

    /// Submits the new challenge. Sets `createdChallenge` on success.
    func create(creator: User) async {
        guard isFormValid, !isLoading else { return }
        isLoading = true
        errorMessage = nil
        do {
            createdChallenge = try await service.createChallenge(
                title: title.trimmingCharacters(in: .whitespaces),
                stake: stake.trimmingCharacters(in: .whitespaces),
                period: period,
                creator: creator
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
