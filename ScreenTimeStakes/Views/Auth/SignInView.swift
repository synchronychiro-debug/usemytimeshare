// SignInView.swift
// Screen 2 — Phone-number entry and SMS code verification.
// Hint shown in previews: mock code is "123456".

import SwiftUI

struct SignInView: View {

    @Binding var path: NavigationPath
    @Environment(AppRouter.self) private var router

    @State private var vm = AuthViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {

                headerSection

                if vm.step == .phone {
                    phoneSection
                } else {
                    codeSection
                }

                if let error = vm.errorMessage {
                    Text(error)
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
        }
        .navigationTitle("Sign In")
        .navigationBarTitleDisplayMode(.large)
    }

    // MARK: - Sections

    private var headerSection: some View {
        VStack(spacing: 8) {
            Image(systemName: "phone.fill")
                .font(.system(size: 40))
                .foregroundStyle(Color.accentColor)

            Text(vm.step == .phone
                 ? "Enter your phone number"
                 : "Enter verification code")
                .font(.headline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private var phoneSection: some View {
        VStack(spacing: 20) {
            TextField("Phone number", text: $vm.phoneNumber)
                .keyboardType(.phonePad)
                .font(.title3)
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            Button("Send Code") {
                Task { await vm.sendCode() }
            }
            .buttonStyle(.stsPrimary(isLoading: vm.isLoading))
            .disabled(!vm.isPhoneValid || vm.isLoading)
        }
    }

    private var codeSection: some View {
        VStack(spacing: 20) {
            Text("Sent to \(vm.phoneNumber)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            TextField("6-digit code", text: $vm.verificationCode)
                .keyboardType(.numberPad)
                .font(.largeTitle.monospacedDigit())
                .multilineTextAlignment(.center)
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            // Hint for demo
            Text("Demo hint: use code 123456")
                .font(.caption)
                .foregroundStyle(.secondary)

            Button("Verify") {
                Task {
                    if let user = await vm.verify() {
                        // Move to permissions screen before entering the app
                        path.append(AuthRoute.permissions)
                        // Pre-seed the router so PermissionsView can finish sign-in
                        router.currentUser = user
                    }
                }
            }
            .buttonStyle(.stsPrimary(isLoading: vm.isLoading))
            .disabled(!vm.isCodeValid || vm.isLoading)

            Button("Use a different number") {
                vm.resetToPhone()
            }
            .font(.subheadline)
            .foregroundStyle(Color.accentColor)
        }
    }
}

#Preview {
    NavigationStack {
        SignInView(path: .constant(NavigationPath()))
            .environment(AppRouter())
    }
}
