// ChallengeCard.swift
// Card shown in the Home feed for each challenge.

import SwiftUI

struct ChallengeCard: View {

    let challenge: Challenge

    private var statusColor: Color {
        switch challenge.status {
        case .active:    return .green
        case .pending:   return .orange
        case .completed: return .secondary
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {

            // Header row
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(challenge.title)
                        .font(.headline)
                    Text(challenge.period.displayName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                StatusPill(status: challenge.status, color: statusColor)
            }

            // Stake
            Label(challenge.stake, systemImage: "trophy.fill")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(2)

            // Member avatars + progress (only for active)
            HStack {
                MemberAvatarRow(members: challenge.members)
                Spacer()
                if challenge.status == .active {
                    Text("\(challenge.daysRemaining)d left")
                        .font(.caption.bold())
                        .foregroundStyle(statusColor)
                }
            }

            if challenge.status == .active {
                ProgressView(value: challenge.progressFraction)
                    .tint(.green)
            }
        }
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Sub-views

private struct StatusPill: View {
    let status: ChallengeStatus
    let color: Color

    var body: some View {
        Text(status.rawValue)
            .font(.caption.bold())
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}

private struct MemberAvatarRow: View {
    let members: [ChallengeMember]
    private let avatarColors: [Color] = [.accentColor, .green, .orange, .purple, .pink]

    var body: some View {
        HStack(spacing: -8) {
            ForEach(Array(members.prefix(4).enumerated()), id: \.element.id) { index, member in
                AvatarView(
                    initials: member.initials,
                    size: 32,
                    color: avatarColors[index % avatarColors.count]
                )
                .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 2))
            }
            if members.count > 4 {
                Circle()
                    .fill(Color(.systemGray4))
                    .frame(width: 32, height: 32)
                    .overlay {
                        Text("+\(members.count - 4)")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                    .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 2))
            }
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        ChallengeCard(challenge: PreviewData.activeChallenge)
        ChallengeCard(challenge: PreviewData.pendingChallenge)
        ChallengeCard(challenge: PreviewData.completedChallenge)
    }
    .padding()
    .background(Color(UIColor.systemGroupedBackground))
}
