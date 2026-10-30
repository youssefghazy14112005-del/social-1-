import { model, Schema, Types } from 'mongoose';

export interface IFollowRaw {
  follower: Types.ObjectId;
  following: Types.ObjectId;
}

const followSchema = new Schema<IFollowRaw>({
  follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1, follower: 1 });

export const FollowModel = model<IFollowRaw>('Follow', followSchema);
