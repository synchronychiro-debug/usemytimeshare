// AvatarView.swift
// Circular avatar showing member initials and a rank badge.

import SwiftUI

struct AvatarView: View {

    let initials: String
    var size: CGFloat = 44
    var color: Color = .accentColor
    var rank: Int? = nil          // If provided, shows a rank badge

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Circle()
                .fill(color.opacity(0.18))
                .frame(width: size, height: size)
                .overlay {
                    Text(initials)
                        .font(.system(size: size * 0.35, weight: .semibold))
                        .foregroundStyle(color)
                }

            if let rank {
                Text("\(rank)")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 18, height: 18)
                    .background(rankColor(rank))
                    .clipShape(Circle())
                    .offset(x: 2, y: -2)
            }
        }
    }

    private func rankColor(_ rank: Int) -> Color {
        switch rank {
        case 1:  return .yellow
        case 2:  return Color(.systemGray3)
        case 3:  return Color(red: 0.8, green: 0.5, blue: 0.2)
        default: return Color(.systemGray4)
        }
    }
}

#Preview {
    HStack(spacing: 16) {
        AvatarView(initials: "AK", rank: 1)
        AvatarView(initials: "BC", color: .green, rank: 2)
        AvatarView(initials: "CD", color: .orange, size: 56, rank: 3)
    }
    .padding()
}
