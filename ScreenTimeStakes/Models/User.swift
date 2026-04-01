// User.swift
// Represents an authenticated app user.

import Foundation

struct User: Identifiable, Codable, Hashable {

    let id: UUID
    var phoneNumber: String
    var displayName: String

    /// Two-letter avatar label derived from the display name.
    /// "Alice Kim" → "AK", "Bob" → "BO"
    var avatarInitials: String {
        let parts = displayName.split(separator: " ")
        if parts.count >= 2 {
            return (String(parts[0].prefix(1)) + String(parts[1].prefix(1))).uppercased()
        }
        return String(displayName.prefix(2)).uppercased()
    }
}
