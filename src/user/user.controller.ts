import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import mongoose from 'mongoose';

@Controller('user')
export class UserController {
  constructor(private user: UserService) {}

  @Get()
  async getUsers(): Promise<User[]> {
    return this.user.findAll();
  }

  @Post()
  async createUsers(@Body() user: CreateUserDto): Promise<User> {
    return this.user.create(user);
  }

  @Post('month-collection')
  async getMonthCollections(@Body() req: any): Promise<any> {
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const collection = await db.collection('invoices');

    const startDate = new Date(req.startDate);
    const endDate = new Date(req.endDate);

    const query = {
      status: 'paid',
      timestamp: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    let totalCollection: any = 0;
    const result = await await collection.find(query).toArray();

    result.forEach((invoice) => {
      totalCollection += invoice.fee_total;
    });

    return totalCollection;
  }

  @Get('total-collection')
  async getTotalCollections(): Promise<any> {
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const collection = await db.collection('invoices');

    const query = {
      status: 'paid',
    };

    // let totalCollection: any = 0;
    const result = await await collection.find(query).toArray();

    // result.forEach((invoice) => {
    //   totalCollection += invoice.fee_total;
    // });

    return result;
  }

  @Get('balance')
  async getBalance(): Promise<any> {
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const collection = await db.collection('invoices');

    const query = {
      status: 'unpaid',
    };

    let totalCollection: any = 0;
    const result = await await collection.find(query).toArray();

    result.forEach((invoice) => {
      totalCollection += invoice.fee_total;
    });

    const balance = (await this.getTotalCollections()) - totalCollection;

    return balance;
  }

  @Get('total-students')
  async totalStudents(): Promise<any> {
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const collection = await db.collection('students');

    const result = await await collection.count();

    return result;
  }

  @Get('total-sections')
  async totalSections(): Promise<any> {
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const collection = await db.collection('sections');

    const result = await await collection.count();
    return result;
  }

  @Post('all-payments')
  async paymentMode(@Body() req: any): Promise<any> {
    const startDate = new Date(req.startDate);
    const endDate = new Date(req.endDate);
    const query = {
      $and: [
        { updatedAt: { $gte: startDate } },
        { updatedAt: { $lt: endDate } },
      ],
    };

    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const data = await db.collection('transactions').find(query).toArray();

    let cash = 0;
    let online = 0;
    let cheque = 0;

    data.forEach((item: any) => {
      let paymentMode = item.payment_mode;

      if (paymentMode === 'CASH' && item.amount) {
        cash += parseInt(item.amount);
      } else if (paymentMode === 'ONLINE' && item.amount) {
        online += parseInt(item.amount);
      } else if (paymentMode === 'CHEQUE' && item.amount) {
        cheque += parseInt(item.amount);
      }
    });

    return { cash, online, cheque };
  }
}
