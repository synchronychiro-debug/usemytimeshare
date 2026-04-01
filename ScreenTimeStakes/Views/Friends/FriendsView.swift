// FriendsView.swift
// Friends tab — people you've competed with, plus invite new ones.

import SwiftUI

struct FriendsView: View {

    @Environment(AppRouter.self) private var router
    @State private var vm = FriendsViewModel()

    var body: some View {
        Group {
            if vm.friends.isEmpty {
                emptyState
            } else {
                friendsList
            }
        }
        .navigationTitle("Friends")
        .searchable(text: $vm.searchText, prompt: "Search friends")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    // TODO: Open contacts picker to invite friends
                } label: {
                    Image(systemName: "person.badge.plus")
                }
            }
        }
        .onAppear {
            if let id = router.currentUser?.id {
                vm.loadFriends(currentUserId: id)
            }
        }
    }

    // MARK: - Friends List

    private var friendsList: some View {
        List {
            Section {
                ForEach(vm.filteredFriends) { friend in
                    FriendRow(friend: friend)
                }
            } header: {
                Text("\(vm.friends.count) people you've competed with")
            }

            Section {
                Button {
                    // TODO: Open contacts picker
                } label: {
                    Label("Invite from Contacts", systemImage: "person.crop.circle.badge.plus")
                }

                Button {
                    // TODO: Share app link
                } label: {
                    Label("Share App Link", systemImage: "square.and.arrow.up")
                }
            } header: {
                Text("Invite More Friends")
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.2")
                .font(.system(size: 56))
                .foregroundStyle(Color.accentColor.opacity(0.4))

            VStack(spacing: 6) {
                Text("No friends yet")
                    .font(.title3.bold())
                Text("Complete a challenge with someone and they'll appear here.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button {
                router.selectedTab = .compete
            } label: {
                Label("Start a Challenge", systemImage: "trophy.fill")
            }
            .buttonStyle(.stsPrimary)
            .padding(.horizontal, 48)
        }
        .padding(.horizontal, 32)
    }
}

// MARK: - Friend Row

private struct FriendRow: View {

    let friend: Friend
    private let colors: [Color] = [.accentColor, .green, .orange, .purple, .pink]

    var body: some View {
        HStack(spacing: 14) {
            // Avatar
            Circle()
                .fill(colors[abs(friend.displayName.hashValue) % colors.count].opacity(0.18))
                .frame(width: 44, height: 44)
                .overlay {
                    Text(friend.initials)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(colors[abs(friend.displayName.hashValue) % colors.count])
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(friend.displayName)
                    .font(.subheadline.bold())
                Text("\(friend.challengesPlayed) challenge\(friend.challengesPlayed == 1 ? "" : "s") together")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Win/loss record
            Text(friend.record)
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        FriendsView()
            .environment({
                let r = AppRouter()
                r.currentUser = PreviewData.alice
                return r
            }())
    }
}
