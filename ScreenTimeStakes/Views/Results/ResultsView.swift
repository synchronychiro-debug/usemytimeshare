// ResultsView.swift
// Screen 8 — Final standings and stake resolution after a challenge ends.

import SwiftUI

struct ResultsView: View {

    let challenge: Challenge
    @Environment(AppRouter.self) private var router
    @State private var vm: ResultsViewModel
    @State private var animatePodium = false

    init(challenge: Challenge) {
        self.challenge = challenge
        _vm = State(initialValue: ResultsViewModel(challenge: challenge))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                winnerBanner
                standingsSection
                stakeResolutionCard
                doneButton
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 40)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Results")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.spring(duration: 0.7).delay(0.2)) {
                animatePodium = true
            }
        }
    }

    // MARK: - Winner Banner

    private var winnerBanner: some View {
        VStack(spacing: 16) {
            if let winner = vm.winner {
                // Trophy animation placeholder
                Image(systemName: "trophy.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.yellow)
                    .scaleEffect(animatePodium ? 1 : 0.5)
                    .opacity(animatePodium ? 1 : 0)

                VStack(spacing: 6) {
                    Text("Winner!")
                        .font(.largeTitle.bold())
                    Text(winner.displayName)
                        .font(.title2)
                        .foregroundStyle(Color.accentColor)
                    if let margin = vm.marginLabel {
                        Text(margin)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                Text("No results yet")
                    .font(.title2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 24)
    }

    // MARK: - Standings

    private var standingsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Final Standings")
                .font(.headline)
                .padding(.leading, 4)

            VStack(spacing: 0) {
                ForEach(Array(vm.rankedMembers.enumerated()), id: \.element.id) { index, member in
                    ResultRow(rank: index + 1, member: member, isWinner: index == 0)
                    if index < vm.rankedMembers.count - 1 {
                        Divider().padding(.leading, 60)
                    }
                }
            }
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    // MARK: - Stake Resolution

    private var stakeResolutionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("The Stake", systemImage: "trophy.fill")
                .font(.headline)
                .foregroundStyle(.orange)

            Text(challenge.stake)
                .font(.body)

            if let loser = vm.loser, let winner = vm.winner {
                Divider()
                Group {
                    Text("\(loser.displayName) ")
                        .fontWeight(.bold)
                        .foregroundStyle(.red)
                    + Text("owes ")
                    + Text(winner.displayName)
                        .fontWeight(.bold)
                        .foregroundStyle(.green)
                    + Text("!")
                }
                .font(.subheadline)
            }
        }
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Done

    private var doneButton: some View {
        Button("Back to Challenges") {
            router.popToRoot()
        }
        .buttonStyle(.stsPrimary)
    }
}

// MARK: - Result Row

private struct ResultRow: View {

    let rank: Int
    let member: ChallengeMember
    let isWinner: Bool

    var body: some View {
        HStack(spacing: 14) {
            // Rank medal
            Group {
                if rank == 1 {
                    Image(systemName: "medal.fill")
                        .foregroundStyle(.yellow)
                } else if rank == 2 {
                    Image(systemName: "medal.fill")
                        .foregroundStyle(Color(.systemGray3))
                } else {
                    Text("\(rank)")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }
            }
            .font(.title3)
            .frame(width: 36)

            AvatarView(initials: member.initials, size: 40, color: isWinner ? .green : .accentColor)

            VStack(alignment: .leading, spacing: 2) {
                Text(member.displayName).font(.subheadline.bold())
                Text("\(member.snapshots.count) day(s)").font(.caption).foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(member.formattedAvg)
                    .font(.subheadline.bold().monospacedDigit())
                    .foregroundStyle(isWinner ? .green : .primary)
                Text("avg/day")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(isWinner ? Color.green.opacity(0.07) : Color.clear)
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        ResultsView(challenge: PreviewData.completedChallenge)
            .environment(AppRouter())
    }
}
