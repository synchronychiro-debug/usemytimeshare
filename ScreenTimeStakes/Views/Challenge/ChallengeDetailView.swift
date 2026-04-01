// ChallengeDetailView.swift
// Screen 7 — Live leaderboard and info for an ongoing or pending challenge.

import SwiftUI

struct ChallengeDetailView: View {

    let challenge: Challenge
    @Environment(AppRouter.self) private var router
    @State private var vm: ChallengeDetailViewModel

    init(challenge: Challenge) {
        self.challenge = challenge
        _vm = State(initialValue: ChallengeDetailViewModel(challenge: challenge))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                headerCard
                leaderboardSection
                inviteSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 32)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(challenge.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if challenge.status == .completed {
                ToolbarItem(placement: .primaryAction) {
                    Button("Results") {
                        router.navigate(to: .results(challenge))
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    // MARK: - Header Card

    private var headerCard: some View {
        VStack(spacing: 16) {

            // Stake
            Label(challenge.stake, systemImage: "trophy.fill")
                .font(.subheadline.bold())
                .foregroundStyle(.orange)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Divider()

            // Progress bar + label
            VStack(spacing: 6) {
                HStack {
                    Text(vm.progressLabel)
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(challenge.period.displayName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                ProgressView(value: challenge.progressFraction)
                    .tint(challenge.status == .active ? .green : .secondary)
            }

            // Invite code
            HStack {
                Label("Invite code", systemImage: "link")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(challenge.inviteCode)
                    .font(.caption.monospaced().bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.accentColor.opacity(0.12))
                    .foregroundStyle(Color.accentColor)
                    .clipShape(Capsule())
                    .onTapGesture {
                        UIPasteboard.general.string = challenge.inviteCode
                    }
            }
        }
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Leaderboard

    private var leaderboardSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Leaderboard")
                .font(.headline)
                .padding(.leading, 4)

            VStack(spacing: 0) {
                ForEach(Array(vm.rankedMembers.enumerated()), id: \.element.id) { index, member in
                    LeaderboardRow(rank: index + 1, member: member, isLeader: index == 0)
                    if index < vm.rankedMembers.count - 1 {
                        Divider().padding(.leading, 60)
                    }
                }
            }
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    // MARK: - Invite Section

    private var inviteSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Invite More People")
                .font(.headline)
                .padding(.leading, 4)

            Button {
                // TODO: integrate ShareLink in next iteration
                UIPasteboard.general.string = "Join my ScreenTimeStakes challenge! Code: \(challenge.inviteCode)"
            } label: {
                Label("Share Invite Code", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.stsSecondary)
        }
    }
}

// MARK: - Leaderboard Row

private struct LeaderboardRow: View {

    let rank: Int
    let member: ChallengeMember
    let isLeader: Bool

    private var rankIcon: String {
        switch rank {
        case 1: return "1.circle.fill"
        case 2: return "2.circle.fill"
        case 3: return "3.circle.fill"
        default: return "\(rank).circle"
        }
    }

    private var rankColor: Color {
        switch rank {
        case 1: return .yellow
        case 2: return Color(.systemGray3)
        case 3: return Color(red: 0.8, green: 0.5, blue: 0.2)
        default: return .secondary
        }
    }

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: rankIcon)
                .font(.title2.bold())
                .foregroundStyle(rankColor)
                .frame(width: 36)

            AvatarView(initials: member.initials, size: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(member.displayName)
                    .font(.subheadline.bold())
                Text(member.snapshots.isEmpty ? "No data yet" : "\(member.snapshots.count) day(s) recorded")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(member.formattedAvg)
                    .font(.subheadline.bold().monospacedDigit())
                    .foregroundStyle(isLeader ? .green : .primary)
                Text("avg/day")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(isLeader ? Color.green.opacity(0.06) : Color.clear)
    }
}

// MARK: - Preview

#Preview("Active") {
    NavigationStack {
        ChallengeDetailView(challenge: PreviewData.activeChallenge)
            .environment(AppRouter())
    }
}

#Preview("Pending") {
    NavigationStack {
        ChallengeDetailView(challenge: PreviewData.pendingChallenge)
            .environment(AppRouter())
    }
}
