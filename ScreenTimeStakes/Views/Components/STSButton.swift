// STSButton.swift
// Reusable primary / secondary button styles for ScreenTimeStakes.

import SwiftUI

// MARK: - Primary Button Style
struct STSPrimaryButtonStyle: ButtonStyle {
    var isLoading: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 8) {
            if isLoading {
                ProgressView()
                    .tint(.white)
                    .scaleEffect(0.85)
            }
            configuration.label
        }
        .font(.headline)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.accentColor.opacity(configuration.isPressed ? 0.8 : 1))
        .foregroundStyle(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Secondary Button Style
struct STSSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color(.systemGray6))
            .foregroundStyle(Color.accentColor)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

// MARK: - Convenience Extensions
extension ButtonStyle where Self == STSPrimaryButtonStyle {
    static var stsPrimary: STSPrimaryButtonStyle { STSPrimaryButtonStyle() }
    static func stsPrimary(isLoading: Bool) -> STSPrimaryButtonStyle {
        STSPrimaryButtonStyle(isLoading: isLoading)
    }
}

extension ButtonStyle where Self == STSSecondaryButtonStyle {
    static var stsSecondary: STSSecondaryButtonStyle { STSSecondaryButtonStyle() }
}
