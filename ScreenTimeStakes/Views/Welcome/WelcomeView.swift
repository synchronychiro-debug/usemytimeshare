// WelcomeView.swift
// Screen 1 — App landing page shown to unauthenticated users.

import SwiftUI

struct WelcomeView: View {

    @Binding var path: NavigationPath
    @State private var isReady = false   // drives fade-in after brief settle

    var body: some View {
        ZStack {
            // Content fades in once the view has settled
            if isReady {
                VStack(spacing: 0) {

                    Spacer()

                    // Hero illustration
                    heroSection

                    Spacer()

                    // Value props
                    featureList
                        .padding(.bottom, 40)

                    Spacer()

                    // CTA
                    actionButtons
                        .padding(.horizontal, 24)
                        .padding(.bottom, 48)
                }
                .transition(.opacity)
            } else {
                // Shown briefly on first launch while SwiftUI settles
                ProgressView()
                    .scaleEffect(1.2)
                    .transition(.opacity)
            }
        }
        .animation(.easeIn(duration: 0.25), value: isReady)
        .navigationBarHidden(true)
        .onAppear {
            // One-frame delay so the NavigationStack is fully laid out
            // before we render the full welcome content
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isReady = true
            }
        }
    }

    // MARK: - Sections

    private var heroSection: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(Color.accentColor.opacity(0.12))
                    .frame(width: 140, height: 140)
                Image(systemName: "iphone.and.arrow.forward")
                    .font(.system(size: 56))
                    .foregroundStyle(Color.accentColor)
            }

            VStack(spacing: 8) {
                Text("ScreenTimeStakes")
                    .font(.largeTitle.bold())

                Text("Put down your phone — or pay the price.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
        }
    }

    private var featureList: some View {
        VStack(alignment: .leading, spacing: 16) {
            FeatureRow(icon: "trophy.fill",         color: .yellow,  text: "Compete with friends on real stakes")
            FeatureRow(icon: "chart.bar.fill",      color: .blue,    text: "Track daily screen time automatically")
            FeatureRow(icon: "person.2.fill",       color: .purple,  text: "Challenge anyone with a simple code")
        }
        .padding(.horizontal, 32)
    }

    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button("Get Started") {
                path.append(AuthRoute.signIn)
            }
            .buttonStyle(.stsPrimary)

            Button("I already have an account") {
                path.append(AuthRoute.signIn)
            }
            .buttonStyle(.stsSecondary)
        }
    }
}

// MARK: - Feature Row
private struct FeatureRow: View {
    let icon: String
    let color: Color
    let text: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.body.bold())
                .foregroundStyle(color)
                .frame(width: 28)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.primary)
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        WelcomeView(path: .constant(NavigationPath()))
    }
}
