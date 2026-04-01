// CompeteView.swift
// Compete tab — entry point for creating or joining a challenge.

import SwiftUI

struct CompeteView: View {

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                headerSection
                actionCards
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 32)
        }
        .background(Color(UIColor.systemGroupedBackground))
        .navigationTitle("Compete")
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 6) {
            Text("Ready to compete?")
                .font(.title2.bold())
            Text("Create a new challenge or join one a friend set up.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Action Cards

    private var actionCards: some View {
        VStack(spacing: 14) {
            NavigationLink(destination: CreateChallengeView()) {
                ActionCard(
                    icon: "plus.circle.fill",
                    iconColor: .accentColor,
                    title: "Create a Challenge",
                    subtitle: "Set the stakes and invite friends to compete"
                )
            }
            .buttonStyle(.plain)

            NavigationLink(destination: JoinChallengeView()) {
                ActionCard(
                    icon: "person.badge.plus",
                    iconColor: .green,
                    title: "Join a Challenge",
                    subtitle: "Enter an invite code from a friend"
                )
            }
            .buttonStyle(.plain)
        }
    }
}

// MARK: - Action Card

private struct ActionCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 36))
                .foregroundStyle(iconColor)
                .frame(width: 52)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.subheadline.bold())
                .foregroundStyle(Color(UIColor.tertiaryLabel))
        }
        .padding(18)
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    NavigationStack {
        CompeteView()
            .environment(AppRouter())
    }
}
