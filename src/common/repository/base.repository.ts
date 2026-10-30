import type { FilterQuery, Model, UpdateQuery } from 'mongoose';
export class DatabaseRepository<TRawDocument> {
  constructor(protected readonly model: Model<TRawDocument>) {}
  createOne(data: Partial<TRawDocument>) { return this.model.create(data); }
  findOne(filter: FilterQuery<TRawDocument>) { return this.model.findOne(filter); }
  findById(id: string) { return this.model.findById(id); }
  find(filter: FilterQuery<TRawDocument> = {}) { return this.model.find(filter); }
  findOneAndUpdate(filter: FilterQuery<TRawDocument>, update: UpdateQuery<TRawDocument>) {
    return this.model.findOneAndUpdate(filter, update, { new: true, runValidators: true });
  }
  updateMany(filter: FilterQuery<TRawDocument>, update: UpdateQuery<TRawDocument>) {
    return this.model.updateMany(filter, update, { runValidators: true });
  }
  deleteOne(filter: FilterQuery<TRawDocument>) { return this.model.deleteOne(filter); }
}
