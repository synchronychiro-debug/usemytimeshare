// CreateChallengeView.swift
// Screen 5 — Form to set up a new screen-time challenge.

import SwiftUI

struct CreateChallengeView: View {

    @Environment(AppRouter.self) private var router
    @State private var vm = CreateChallengeViewModel()

    var body: some View {
        Form {
            basicInfoSection
            periodSection
            stakeSection
        }
        .navigationTitle("New Challenge")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbarContent }
        // Navigate to the created challenge detail once done
        .onChange(of: vm.createdChallenge) { _, challenge in
            if let challenge {
                router.navigate(to: .challengeDetail(challenge))
            }
        }
        .alert("Error", isPresented: .constant(vm.errorMessage != nil)) {
            Button("OK") { vm.errorMessage = nil }
        } message: {
            Text(vm.errorMessage ?? "")
        }
    }

    // MARK: - Sections

    private var basicInfoSection: some View {
        Section {
            TextField("Challenge name", text: $vm.title)
        } header: {
            Text("Name")
        } footer: {
            Text("e.g. \"Weekly Detox\" or \"No-Phone Weekend\"")
        }
    }

    private var periodSection: some View {
        Section {
            Picker("Period", selection: $vm.period) {
                ForEach(ChallengePeriod.allCases) { period in
                    VStack(alignment: .leading) {
                        Text(period.displayName)
                        Text(period.subtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .tag(period)
                }
            }
            .pickerStyle(.inline)
            .labelsHidden()
        } header: {
            Text("Duration")
        }
    }

    private var stakeSection: some View {
        Section {
            TextField("What does the loser have to do?", text: $vm.stake, axis: .vertical)
                .lineLimit(3...6)
        } header: {
            Text("The Stake")
        } footer: {
            Text("e.g. \"Loser does dishes every day for a week\"")
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .confirmationAction) {
            if vm.isLoading {
                ProgressView()
            } else {
                Button("Create") {
                    guard let user = router.currentUser else { return }
                    Task { await vm.create(creator: user) }
                }
                .disabled(!vm.isFormValid)
                .fontWeight(.semibold)
            }
        }
    }
}

#Preview {
    NavigationStack {
        CreateChallengeView()
            .environment({
                let r = AppRouter()
                r.currentUser = PreviewData.alice
                return r
            }())
    }
}
