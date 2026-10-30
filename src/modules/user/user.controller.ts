import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { responseFormatter } from '../../middleware/response.middleware.js';
import { validation } from '../../middleware/validation.middleware.js';
import type { UpdatePrivacyDto, UpdateProfileDto, UserListDto, UserSearchDto } from './dto/user.dto.js';
import { userService } from './user.service.js';
import { updatePrivacySchema, updateProfileSchema, userIdSchema, userListSchema, userSearchSchema } from './user.validation.js';

const router = Router();
router.use(authMiddleware);

router.get('/me', responseFormatter((req) => userService.getMe(req.auth!.userId)));
router.patch('/me', validation(updateProfileSchema), responseFormatter((req) => userService.updateProfile(req.auth!.userId, req.body as UpdateProfileDto)));
router.patch('/me/privacy', validation(updatePrivacySchema), responseFormatter((req) => userService.updatePrivacy(req.auth!.userId, req.body as UpdatePrivacyDto)));
router.get('/search', validation(userSearchSchema, 'query'), responseFormatter((req) => userService.search(req.validatedData as UserSearchDto, req.auth!.userId)));
router.get('/suggestions', validation(userListSchema, 'query'), responseFormatter((req) => userService.suggestions(req.validatedData as UserListDto, req.auth!.userId)));
router.post('/:userId/follow', validation(userIdSchema, 'params'), responseFormatter((req) => userService.follow(req.auth!.userId, String(req.params.userId)), 201));
router.delete('/:userId/follow', validation(userIdSchema, 'params'), responseFormatter((req) => userService.unfollow(req.auth!.userId, String(req.params.userId))));
router.get('/:userId', validation(userIdSchema, 'params'), responseFormatter((req) => userService.getProfile(String(req.params.userId), req.auth!.userId)));

export default router;
