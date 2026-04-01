// HomeView.swift
// Screen 4 — Dashboard showing the user's active, pending, and completed challenges.

import SwiftUI

struct HomeView: View {

    @Environment(AppRouter.self) private var router
    @State private var vm = HomeViewModel()

    var body: some View {
        // Skip the loading spinner — mock is instant, real backend will be fast enough
        // that a skeleton/refresh is preferable to a blocking spinner
        challengeList
        .navigationTitle("My Challenges")
        .task {
            if let userId = router.currentUser?.id {
                await vm.loadChallenges(for: userId)
            }
        }
        .refreshable {
            if let userId = router.currentUser?.id {
                await vm.loadChallenges(for: userId)
            }
        }
        .alert("Error", isPresented: .constant(vm.errorMessage != nil)) {
            Button("OK") { vm.errorMessage = nil }
        } message: {
            Text(vm.errorMessage ?? "")
        }
    }

    // MARK: - List

    private var challengeList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {

                if vm.challenges.isEmpty {
                    emptyState
                        .padding(.top, 60)
                } else {
                    if !vm.activeChallenges.isEmpty {
                        section(title: "Active", challenges: vm.activeChallenges)
                    }
                    if !vm.pendingChallenges.isEmpty {
                        section(title: "Pending", challenges: vm.pendingChallenges)
                    }
                    if !vm.completedChallenges.isEmpty {
                        section(title: "Completed", challenges: vm.completedChallenges)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Section

    private func section(title: String, challenges: [Challenge]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.leading, 4)

            ForEach(challenges) { challenge in
                Button {
                    if challenge.status == .completed {
                        router.navigate(to: .results(challenge))
                    } else {
                        router.navigate(to: .challengeDetail(challenge))
                    }
                } label: {
                    ChallengeCard(challenge: challenge)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "trophy")
                .font(.system(size: 56))
                .foregroundStyle(Color.accentColor.opacity(0.4))

            VStack(spacing: 6) {
                Text("No challenges yet")
                    .font(.title3.bold())
                Text("Create one or join a friend's challenge to get started.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            HStack(spacing: 12) {
                Button("Compete") { router.selectedTab = .compete }
                    .buttonStyle(.stsPrimary)
            }
            .padding(.horizontal, 32)
        }
        .padding(.horizontal, 32)
    }

}

#Preview {
    let router = AppRouter()
    router.isAuthenticated = true
    router.currentUser = PreviewData.alice
    return NavigationStack {
        HomeView()
            .environment(router)
    }
}
