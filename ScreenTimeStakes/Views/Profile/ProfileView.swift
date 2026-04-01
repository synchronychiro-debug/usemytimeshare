// ProfileView.swift
// Profile tab — user stats, settings, and sign out.

import SwiftUI

struct ProfileView: View {

    @Environment(AppRouter.self) private var router
    @State private var vm = ProfileViewModel()
    @State private var showSignOutConfirm = false

    var body: some View {
        List {
            avatarSection
            statsSection
            settingsSection
            signOutSection
        }
        .navigationTitle("Profile")
        .onAppear {
            if let id = router.currentUser?.id {
                vm.loadStats(for: id)
            }
        }
        .confirmationDialog("Sign out?", isPresented: $showSignOutConfirm, titleVisibility: .visible) {
            Button("Sign Out", role: .destructive) { router.signOut() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You'll need to sign in again to access your challenges.")
        }
    }

    // MARK: - Sections

    private var avatarSection: some View {
        Section {
            HStack(spacing: 16) {
                // Large avatar
                Circle()
                    .fill(Color.accentColor.opacity(0.15))
                    .frame(width: 64, height: 64)
                    .overlay {
                        Text(router.currentUser?.avatarInitials ?? "?")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(Color.accentColor)
                    }

                VStack(alignment: .leading, spacing: 4) {
                    Text(router.currentUser?.displayName ?? "Unknown")
                        .font(.title3.bold())
                    Text(router.currentUser?.phoneNumber ?? "")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 6)
        }
    }

    private var statsSection: some View {
        Section("Your Stats") {
            StatRow(icon: "trophy.fill",      color: .yellow,  label: "Total Wins",         value: "\(vm.wins)")
            StatRow(icon: "flag.checkered",   color: .blue,    label: "Challenges Played",  value: "\(vm.totalChallenges)")
            StatRow(icon: "flame.fill",       color: .orange,  label: "Day Streak",         value: "\(vm.currentStreak) days")
        }
    }

    private var settingsSection: some View {
        Section("Settings") {
            // Placeholder — will expand with notification prefs, display name edit, etc.
            Label("Notifications", systemImage: "bell.fill")
            Label("Screen Time Permission", systemImage: "lock.shield.fill")
        }
        .foregroundStyle(.primary)
    }

    private var signOutSection: some View {
        Section {
            Button(role: .destructive) {
                showSignOutConfirm = true
            } label: {
                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
            }
        }
    }
}

// MARK: - Stat Row

private struct StatRow: View {
    let icon: String
    let color: Color
    let label: String
    let value: String

    var body: some View {
        HStack {
            Label(label, systemImage: icon)
                .foregroundStyle(.primary)
            Spacer()
            Text(value)
                .font(.subheadline.bold())
                .foregroundStyle(color)
        }
    }
}

#Preview {
    NavigationStack {
        ProfileView()
            .environment({
                let r = AppRouter()
                r.currentUser = PreviewData.alice
                return r
            }())
    }
}
