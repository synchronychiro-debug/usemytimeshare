// AuthService.swift
// Mock phone-based authentication service.
// Replace the internals with a real backend (e.g. Firebase Auth, Twilio Verify) in v1.

import Foundation

// MARK: - Errors
enum AuthError: LocalizedError {
    case invalidPhoneNumber
    case invalidCode
    case networkUnavailable
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .invalidPhoneNumber:  return "Please enter a valid phone number."
        case .invalidCode:         return "That code is incorrect. Try again."
        case .networkUnavailable:  return "No network connection. Please try again."
        case .unknown(let msg):    return msg
        }
    }
}

// MARK: - AuthService
/// Singleton mock authentication service.
/// Mock rule: any 10+-digit number is accepted; code "123456" always succeeds.
@Observable
final class AuthService {

    static let shared = AuthService()
    private init() {}

    private(set) var currentUser: User?

    // MARK: - API

    /// Simulate sending an SMS verification code.
    func sendVerificationCode(to phoneNumber: String) async throws {
        guard phoneNumber.filter(\.isNumber).count >= 10 else {
            throw AuthError.invalidPhoneNumber
        }
        // No delay in mock — real implementation will await network
    }

    /// Simulate verifying the SMS code.
    /// - Returns: The signed-in User on success.
    /// - The mock accepts only "123456" as the valid code.
    func verifyCode(_ code: String, for phoneNumber: String) async throws -> User {
        guard code == "123456" else { throw AuthError.invalidCode }

        let user = User(
            id: UUID(),
            phoneNumber: phoneNumber,
            displayName: "New User"   // Will be set during onboarding in a later version
        )
        currentUser = user
        return user
    }

    func signOut() {
        currentUser = nil
    }
}
