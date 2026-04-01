// AuthViewModel.swift
// Drives the two-step phone-auth flow: phone entry → code verification.

import Foundation

@Observable
final class AuthViewModel {

    // MARK: - State
    enum Step { case phone, code }

    var step: Step = .phone
    var phoneNumber: String = ""
    var verificationCode: String = ""
    var isLoading: Bool = false
    var errorMessage: String?

    private let auth = AuthService.shared

    // MARK: - Validation

    var isPhoneValid: Bool {
        phoneNumber.filter(\.isNumber).count >= 10
    }

    var isCodeValid: Bool {
        verificationCode.filter(\.isNumber).count == 6
    }

    // MARK: - Actions

    /// Sends the SMS code. On success, advances to the .code step.
    func sendCode() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        do {
            try await auth.sendVerificationCode(to: phoneNumber)
            step = .code
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    /// Verifies the entered code.
    /// - Returns: The authenticated User on success, nil on failure.
    func verify() async -> User? {
        guard !isLoading else { return nil }
        isLoading = true
        errorMessage = nil
        do {
            let user = try await auth.verifyCode(verificationCode, for: phoneNumber)
            isLoading = false
            return user
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return nil
        }
    }

    func resetToPhone() {
        step = .phone
        verificationCode = ""
        errorMessage = nil
    }
}
