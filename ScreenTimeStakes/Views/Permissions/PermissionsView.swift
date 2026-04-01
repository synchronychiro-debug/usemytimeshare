// PermissionsView.swift
// Screen 3 — Explains and requests the ScreenTime / Family Controls permission.
// Production: use FamilyControls framework to request authorization.

import SwiftUI

struct PermissionsView: View {

    @Environment(AppRouter.self) private var router
    @State private var isRequesting = false

    var body: some View {
        VStack(spacing: 0) {

            Spacer()

            illustrationSection

            Spacer()

            permissionsList
                .padding(.horizontal, 32)

            Spacer()

            actionSection
                .padding(.horizontal, 24)
                .padding(.bottom, 48)
        }
        .navigationTitle("")
        .navigationBarBackButtonHidden(true)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }

    // MARK: - Sections

    private var illustrationSection: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.12))
                    .frame(width: 130, height: 130)
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 54))
                    .foregroundStyle(.green)
            }

            VStack(spacing: 8) {
                Text("One permission needed")
                    .font(.title2.bold())
                Text("ScreenTimeStakes needs access to Screen Time data so scores can be compared fairly.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
            }
        }
    }

    private var permissionsList: some View {
        VStack(alignment: .leading, spacing: 18) {
            PermissionRow(icon: "eye.slash.fill",   color: .blue,   title: "Private",    detail: "Only your average is shared — not app-by-app data.")
            PermissionRow(icon: "person.fill",      color: .purple, title: "Your device only", detail: "Data never leaves your phone until you choose to share.")
            PermissionRow(icon: "checkmark.shield", color: .green,  title: "Revocable",  detail: "You can remove access at any time in Settings.")
        }
    }

    private var actionSection: some View {
        VStack(spacing: 12) {
            Button(isRequesting ? "Requesting…" : "Allow Screen Time Access") {
                requestPermission()
            }
            .buttonStyle(.stsPrimary(isLoading: isRequesting))
            .disabled(isRequesting)

            Button("Skip for now") {
                finishOnboarding()
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
    }

    // MARK: - Actions

    private func requestPermission() {
        isRequesting = true
        // TODO: Replace with FamilyControls.AuthorizationCenter.shared.requestAuthorization()
        // Simulate async permission request
        Task {
            try? await Task.sleep(for: .milliseconds(1200))
            finishOnboarding()
        }
    }

    private func finishOnboarding() {
        guard let user = router.currentUser else { return }
        router.signIn(user: user)
    }
}

// MARK: - Permission Row
private struct PermissionRow: View {
    let icon: String
    let color: Color
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.body.bold())
                .foregroundStyle(color)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold())
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    let router = AppRouter()
    router.currentUser = PreviewData.alice
    return NavigationStack {
        PermissionsView()
            .environment(router)
    }
}
