// JoinChallengeView.swift
// Screen 6 — Enter an invite code to join a friend's challenge.

import SwiftUI

struct JoinChallengeView: View {

    @Environment(AppRouter.self) private var router
    @State private var vm = JoinChallengeViewModel()
    @FocusState private var codeFocused: Bool

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {

                headerSection

                codeInputSection

                if let error = vm.errorMessage {
                    Text(error)
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                joinButton
            }
            .padding(.horizontal, 24)
            .padding(.top, 32)
        }
        .navigationTitle("Join Challenge")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { codeFocused = true }
        .onChange(of: vm.joinedChallenge) { _, challenge in
            if let challenge {
                router.navigate(to: .challengeDetail(challenge))
            }
        }
    }

    // MARK: - Sections

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.badge.plus")
                .font(.system(size: 48))
                .foregroundStyle(Color.accentColor)

            Text("Got an invite code?")
                .font(.title3.bold())

            Text("Ask a friend to share their challenge code, then enter it below.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private var codeInputSection: some View {
        VStack(spacing: 8) {
            TextField("e.g. WKD-42", text: $vm.inviteCode)
                .font(.largeTitle.monospaced().bold())
                .multilineTextAlignment(.center)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.characters)
                .focused($codeFocused)
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14))

            Text("Demo hint: try \"WKD-42\"")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var joinButton: some View {
        Button("Join Challenge") {
            guard let user = router.currentUser else { return }
            Task { await vm.join(as: user) }
        }
        .buttonStyle(.stsPrimary(isLoading: vm.isLoading))
        .disabled(!vm.isCodeValid || vm.isLoading)
    }
}

#Preview {
    NavigationStack {
        JoinChallengeView()
            .environment({
                let r = AppRouter()
                r.currentUser = PreviewData.bob
                return r
            }())
    }
}
