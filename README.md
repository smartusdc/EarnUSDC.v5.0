# EarnUSDC Frontend

Base Network上でUSDCを預け入れ、高利回りを得るためのフロントエンドアプリケーション。

## ファイル構成

```
src/
├── core/
│   ├── events.js     # イベント管理システム
│   └── store.js      # アプリケーション状態管理
│
├── transactions/
│   ├── gas.js        # ガス計算とトランザクション準備
│   └── executor.js   # トランザクション実行処理
│
├── wallet/
│   ├── connector.js  # ウォレット接続管理
│   └── events.js     # ウォレット関連イベント
│
├── ui/
│   ├── alerts.js     # アラート表示コンポーネント
│   ├── modals.js     # モーダル管理
│   ├── forms.js      # フォームコンポーネント
│   └── dashboard.js  # メインダッシュボードUI
│
└── utils/
    ├── formatters.js # 数値フォーマット
    └── validators.js # 入力検証
```

## 主な機能

- ウォレット接続と管理
- USDC預け入れ/引き出し
- 報酬計算と請求
- リファラルシステム
- ランクシステム

## 技術スタック

- Web3.js - ブロックチェーン接続
- Tailwind CSS - スタイリング
- バニラJavaScript - コア機能

## 開発ガイドライン

### コード規約

- ファイルサイズ: 200行以下を目標
- 関数の長さ: 50行以下を推奨
- コメント: 重要な関数には必ずJSDocを記述

### エラー処理

- すべてのエラーは適切にキャッチし、ユーザーフレンドリーなメッセージを表示
- トランザクションエラーは特に丁寧に処理

### イベント管理

- コンポーネント間の通信にはイベントシステムを使用
- イベント名は `category:action` の形式で統一

### 状態管理

- グローバル状態は `store.js` で一元管理
- コンポーネントは状態の変更を直接行わない

## ファイル編集時の注意点

1. 各ファイルは適切な役割分担を保つ
2. 重複するロジックは共通化する
3. ファイルサイズが大きくなる場合は分割を検討

## デプロイ

1. 必要な環境変数を設定
2. ビルドコマンドを実行
3. 生成されたファイルをデプロイ

## Claudeでの更新手順

1. 必要なファイルをまとめてアップロード
2. 変更内容を明確に説明
3. 修正後のファイルを確認
4. 動作確認の手順を実行

## コントラクト情報

- Contract Address: 0x3038eBDFF5C17d9B0f07871b66FCDc7B9329fCD8
- Network: Base Mainnet
- Token: USDC (6 decimals)

## 今後の改善点

### 優先度高

1. ガス計算の最適化
- 価格推定の精度向上
- エラー時のフォールバック処理の改善
- ユーザーへのフィードバック強化

2. ウォレット操作のUX改善
- 接続状態の安定性向上
- エラーメッセージの明確化
- ネットワーク切り替えの自動化

3. トランザクション管理の強化
- 履歴管理の実装
- ステータス表示の改善
- 失敗時のリカバリー機能

### 中期的な改善

1. パフォーマンス最適化
- コードの最適化
- キャッシュの導入
- バンドルサイズの削減

2. セキュリティ強化
- 入力値のバリデーション強化
- トランザクション承認の二段階確認
- レート制限の導入

3. UI/UX の改善
- モバイル対応の強化
- アクセシビリティの向上
- アニメーションの最適化

### 長期的な計画

1. 機能追加
- 追加の報酬システム
- 高度な分析ツール
- 自動化機能

2. インフラストラクチャ
- CDNの導入
- 監視システムの構築
- バックアップシステムの強化

3. コミュニティ対応
- 多言語対応
- コミュニティフィードバックの収集
- ドキュメントの充実

## メンテナンス手順

### 日常的なメンテナンス

1. エラーログの確認
2. パフォーマンスモニタリング
3. ユーザーフィードバックの確認
4. セキュリティアップデートの適用

### 定期的なメンテナンス

1. コードレビュー
2. パフォーマンス最適化
3. 依存関係の更新
4. セキュリティ監査

### エラー発生時の対応

1. エラーの特定と記録
2. 影響範囲の確認
3. 修正の適用
4. ユーザーへの通知

## トラブルシューティング

### よくある問題と解決策

1. ウォレット接続エラー
- MetaMaskの再起動
- ネットワーク設定の確認
- キャッシュのクリア

2. トランザクション失敗
- ガス価格の調整
- ネットワーク混雑の確認
- 残高の確認

3. UI表示の問題
- ブラウザのリロード
- キャッシュのクリア
- コンソールエラーの確認

## 貢献ガイドライン

1. イシューの作成
2. ブランチの作成
3. コードの変更
4. プルリクエストの作成
5. レビュー対応

## ライセンス

MIT License

## 開発者向け情報

- Node.js version: 16.x以上
- テストツール: Jest
- コード整形: ESLint + Prettier
- パッケージマネージャー: npm

## サポート

技術的な問題やバグ報告は、以下の方法で行えます：

1. GitHubイシュー
2. Discordコミュニティ
3. サポートメール

このコード群に対応するスマートコントラクトのアドレスは 0x3038eBDFF5C17d9B0f07871b66FCDc7B9329fCD8
スマートコントラクトの内容全文は下記
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract EarnUSDC is Ownable(msg.sender), ReentrancyGuard {
    using SafeMath for uint256;

    // USDCトークンコントラクト
    IERC20 public usdcToken;

    // 基本的なユーザーデータ
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositTimestamps;
    mapping(address => uint256) public depositRewards;
    mapping(address => uint256) public referralRewards;
    mapping(uint256 => address) public referralCodeToUser;
    mapping(address => uint256) public userToReferralCode;
    mapping(address => bool) public frozenAccounts;

    // リファラル関連の構造体とマッピング
    struct Referral {
        address referrer;
        uint256 referralCode;
        bool exists;
    }
    mapping(address => Referral) public userReferrals;

    // ランク設定
    struct RankConfig {
        string name;          // ランク名称
        uint256 threshold;    // 必要累積報酬額
        uint256 bonusRate;    // ボーナス率
        bool isActive;        // ランクの有効性
    }
    mapping(uint256 => RankConfig) public ranks;
    uint256 public rankCount;
    uint256 public constant MAX_RANKS = 20;

    // 累積報酬の追跡
    struct UserRewardStats {
        uint256 totalDepositRewards;    // 預入報酬の累積
        uint256 totalBonusRewards;      // ボーナス報酬の累積
        uint256 lastUpdateTimestamp;    // 最終更新時刻
    }
    mapping(address => UserRewardStats) public userRewardStats;

    // ユーザーアクティビティ追跡
    struct UserActivity {
        uint256 lastActionTimestamp;   // 最終アクション時刻
        uint256 dailyWithdrawCount;    // 24時間の引き出し回数
        bool isFirstDeposit;           // 初回デポジットフラグ
    }
    mapping(address => UserActivity) public userActivities;
    mapping(uint256 => address[]) public dailyActiveUsers;

    // 運用設定
    uint256 public currentAPR;                      // 現在のAPR（100 = 1%）
    uint256 public referrerRewardRate;              // 紹介者報酬率
    uint256 public referredRewardRate;              // 被紹介者報酬率
    uint256 public constant MIN_DEPOSIT = 0.01 * 10**6;  // 0.01 USDC (6桁の精度)
    uint256 public suspiciousWithdrawalThreshold;   // 異常取引の閾値
    
    // 管理者設定
    address public operationalWallet;
    uint256 public minContractBalance;
    bool public isDepositPaused;
    bool public isWithdrawalPaused;
    bool public isRewardClaimPaused;

    // コントラクトの初期化
    constructor(address _usdcTokenAddress) {
        usdcToken = IERC20(_usdcTokenAddress);
        
        // 初期設定
        currentAPR = 2400;                  // 24%
        referrerRewardRate = 500;           // 5%
        referredRewardRate = 700;           // 7%
        suspiciousWithdrawalThreshold = 10; // 24時間で10回

        // 初期ランク設定
        ranks[0] = RankConfig("Normal", 0, 0, true);
        ranks[1] = RankConfig("Silver", 100 * 10**6, 100, true);          // 100 USDC, 1%
        ranks[2] = RankConfig("Gold", 1000 * 10**6, 200, true);          // 1,000 USDC, 2%
        ranks[3] = RankConfig("Platinum", 10000 * 10**6, 300, true);     // 10,000 USDC, 3%
        ranks[4] = RankConfig("Whale", 100000 * 10**6, 400, true);       // 100,000 USDC, 4%
        rankCount = 5;
    }

    // モディファイア
    modifier whenNotPaused(bool pauseFlag) {
        require(!pauseFlag, "Function is paused");
        _;
    }

    modifier notFrozen() {
        require(!frozenAccounts[msg.sender], "Account is frozen");
        _;
    }
    // 預入機能
    function depositFunds(uint256 amount, uint256 referralCode) external nonReentrant whenNotPaused(isDepositPaused) notFrozen {
        require(amount >= MIN_DEPOSIT, "Deposit amount too low");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // 既存の報酬を確定
        uint256 pendingReward = calculateReward(msg.sender);
        if (pendingReward > 0) {
            depositRewards[msg.sender] = depositRewards[msg.sender].add(pendingReward);
        }

        // リファラル処理
        if (referralCode != 0 && !userReferrals[msg.sender].exists) {
            processReferral(referralCode);
        }

        // 初回預入時の処理
        if (deposits[msg.sender] == 0) {
            depositTimestamps[msg.sender] = block.timestamp;
            UserActivity storage activity = userActivities[msg.sender];
            if (!activity.isFirstDeposit) {
                activity.isFirstDeposit = true;
            }
        }

        updateUserActivity(msg.sender, "deposit");
        deposits[msg.sender] = deposits[msg.sender].add(amount);
        depositTimestamps[msg.sender] = block.timestamp;
        
        emit Deposit(msg.sender, amount);
    }

    // 引出機能
    function withdraw(uint256 amount) external nonReentrant whenNotPaused(isWithdrawalPaused) notFrozen {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        
        // 既存の報酬を確定
        uint256 pendingReward = calculateReward(msg.sender);
        if (pendingReward > 0) {
            depositRewards[msg.sender] = depositRewards[msg.sender].add(pendingReward);
        }

        updateUserActivity(msg.sender, "withdraw");
        deposits[msg.sender] = deposits[msg.sender].sub(amount);
        depositTimestamps[msg.sender] = block.timestamp;
        
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawal(msg.sender, amount);
    }

    // 報酬計算
    function calculateReward(address userAddress) public view returns (uint256) {
        uint256 userDeposit = deposits[userAddress];
        if (userDeposit == 0) return 0;

        uint256 depositTime = depositTimestamps[userAddress];
        uint256 timePassed = block.timestamp - depositTime;
        
        // APRをbpsとして扱う
        uint256 annualRate = currentAPR * 100;
        
        // 時間比率の計算（精度を上げるため10000を掛ける）
        uint256 timeRatio = timePassed.mul(10000).div(365 days);
        
        // 報酬計算
        uint256 reward = userDeposit
            .mul(annualRate)
            .mul(timeRatio)
            .div(1000000); // 最終的な調整
        
        return reward;
    }

    // 預入報酬請求
    function claimDepositReward() external nonReentrant whenNotPaused(isRewardClaimPaused) notFrozen {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No deposit rewards to claim");

        // 累積報酬の更新
        UserRewardStats storage stats = userRewardStats[msg.sender];
        uint256 newTotalRewards = stats.totalDepositRewards.add(reward);
        
        // ランクボーナスの計算
        uint256 bonusAmount = calculateRankBonus(newTotalRewards, reward);
        
        // 状態の更新
        stats.totalDepositRewards = newTotalRewards;
        if (bonusAmount > 0) {
            stats.totalBonusRewards = stats.totalBonusRewards.add(bonusAmount);
        }
        stats.lastUpdateTimestamp = block.timestamp;

        // リファラル報酬の処理
        if (userReferrals[msg.sender].exists && userReferrals[msg.sender].referrer != address(0)) {
            uint256 referralReward = reward.mul(referredRewardRate).div(10000);
            uint256 referrerReward = reward.mul(referrerRewardRate).div(10000);

            referralRewards[msg.sender] = referralRewards[msg.sender].add(referralReward);
            referralRewards[userReferrals[msg.sender].referrer] = referralRewards[userReferrals[msg.sender].referrer].add(referrerReward);
        }

        // タイムスタンプの更新
        depositTimestamps[msg.sender] = block.timestamp;

        // 報酬の転送
        uint256 totalReward = reward.add(bonusAmount);
        require(usdcToken.transfer(msg.sender, totalReward), "Transfer failed");
        
        emit DepositRewardClaimed(msg.sender, reward, bonusAmount, stats.totalDepositRewards);
    }

    // リファラル報酬請求
    function claimReferralReward() external nonReentrant whenNotPaused(isRewardClaimPaused) notFrozen {
        uint256 referralReward = referralRewards[msg.sender];
        require(referralReward > 0, "No referral rewards to claim");

        referralRewards[msg.sender] = 0;
        require(usdcToken.transfer(msg.sender, referralReward), "Transfer failed");
        
        emit ReferralRewardClaimed(msg.sender, referralReward);
    }

    // リファラル処理
    function processReferral(uint256 referralCode) internal {
        require(!userReferrals[msg.sender].exists, "User already has referral");
        
        address referrer = referralCodeToUser[referralCode];
        require(referrer != address(0) && referrer != msg.sender, "Invalid referrer");

        userReferrals[msg.sender] = Referral(referrer, referralCode, true);
        emit ReferralProcessed(msg.sender, referrer, referralCode);
    }
    // ランクボーナス計算
    function calculateRankBonus(uint256 totalAccumulatedRewards, uint256 newReward) internal view returns (uint256) {
        // 現在のランクを取得（上位ランクから確認）
        uint256 rankId = 0;
        for (uint256 i = rankCount - 1; i > 0; i--) {
            if (totalAccumulatedRewards >= ranks[i].threshold && ranks[i].isActive) {
                rankId = i;
                break;
            }
        }

        // ボーナス率が0の場合は早期リターン
        uint256 bonusRate = ranks[rankId].bonusRate;
        if (bonusRate == 0) return 0;

        // ボーナス計算
        uint256 bonusAmount = newReward
            .mul(bonusRate)
            .div(10000);  // bpsをパーセントに変換
            
        return bonusAmount;
    }

    // 新しいランクの追加
    function addRank(
        string memory name,
        uint256 threshold,
        uint256 bonusRate,
        bool isActive
    ) external onlyOwner {
        require(rankCount < MAX_RANKS, "Maximum rank count reached");
        if (rankCount > 0) {
            require(threshold > ranks[rankCount - 1].threshold, "Threshold must be higher than previous rank");
        }
        
        ranks[rankCount] = RankConfig({
            name: name,
            threshold: threshold,
            bonusRate: bonusRate,
            isActive: isActive
        });
        
        emit RankAdded(rankCount, name, threshold, bonusRate, isActive);
        rankCount++;
    }

    // 最上位ランクの削除
    function removeLastRank() external onlyOwner {
        require(rankCount > 1, "Cannot remove base rank");
        rankCount--;
        emit RankRemoved(rankCount, ranks[rankCount].name);
        delete ranks[rankCount];
    }

    // ランク設定の更新
    function updateRankConfig(
        uint256 rankId,
        string memory name,
        uint256 threshold,
        uint256 bonusRate,
        bool isActive
    ) external onlyOwner {
        require(rankId < rankCount, "Invalid rank ID");
        
        // 閾値の整合性チェック
        if (rankId > 0) {
            require(threshold > ranks[rankId - 1].threshold, "Threshold must be higher than previous rank");
        }
        if (rankId < rankCount - 1) {
            require(threshold < ranks[rankId + 1].threshold, "Threshold must be lower than next rank");
        }

        ranks[rankId].name = name;
        ranks[rankId].threshold = threshold;
        ranks[rankId].bonusRate = bonusRate;
        ranks[rankId].isActive = isActive;
        
        emit RankConfigUpdated(rankId, name, threshold, bonusRate, isActive);
    }

    // ユーザーのランク情報取得
    function getUserRank(address user) public view returns (
        uint256 rankId,
        string memory rankName,
        uint256 bonusRate,
        uint256 nextRankThreshold,
        uint256 progressToNextRank
    ) {
        uint256 totalRewards = userRewardStats[user].totalDepositRewards;
        
        // 現在のランク決定
        rankId = 0;
        for (uint256 i = rankCount - 1; i > 0; i--) {
            if (totalRewards >= ranks[i].threshold && ranks[i].isActive) {
                rankId = i;
                break;
            }
        }

        // 次のランクまでの情報
        uint256 nextRankId = rankId;
        for (uint256 i = rankId + 1; i < rankCount; i++) {
            if (ranks[i].isActive) {
                nextRankId = i;
                break;
            }
        }

        nextRankThreshold = ranks[nextRankId].threshold;
        if (nextRankId > rankId) {
            progressToNextRank = ((totalRewards - ranks[rankId].threshold) * 10000) /
                (ranks[nextRankId].threshold - ranks[rankId].threshold);
        } else {
            progressToNextRank = 10000; // 100.00%
        }

        return (
            rankId,
            ranks[rankId].name,
            ranks[rankId].bonusRate,
            nextRankThreshold,
            progressToNextRank
        );
    }

    // リファラルコード生成
    function generateReferralCode() public notFrozen returns (uint256) {
        require(userToReferralCode[msg.sender] == 0, "Referral code already exists");
        
        uint256 nonce = 0;
        uint256 code;
        do {
            code = uint256(keccak256(abi.encodePacked(
                msg.sender,
                block.timestamp,
                nonce
            ))) % 1000000;
            nonce++;
        } while (referralCodeToUser[code] != address(0));

        userToReferralCode[msg.sender] = code;
        referralCodeToUser[code] = msg.sender;
        
        emit ReferralCodeCreated(msg.sender, code);
        return code;
    }
    // APRの更新
    function updateAPR(uint256 _newAPR) external onlyOwner {
        currentAPR = _newAPR;
        emit APRUpdated(_newAPR);
    }

    // リファラル報酬率の更新
    function updateReferralRewardRates(uint256 _referrerRate, uint256 _referredRate) external onlyOwner {
        referrerRewardRate = _referrerRate;
        referredRewardRate = _referredRate;
        emit ReferralRewardRateUpdated(_referrerRate, _referredRate);
    }

    // 機能の一時停止/再開
    function toggleDepositPause() external onlyOwner {
        isDepositPaused = !isDepositPaused;
        emit PauseStatusChanged("deposit", isDepositPaused);
    }

    function toggleWithdrawalPause() external onlyOwner {
        isWithdrawalPaused = !isWithdrawalPaused;
        emit PauseStatusChanged("withdrawal", isWithdrawalPaused);
    }

    function toggleRewardClaimPause() external onlyOwner {
        isRewardClaimPaused = !isRewardClaimPaused;
        emit PauseStatusChanged("reward_claim", isRewardClaimPaused);
    }

    // アカウントの凍結/解除
    function setAccountFrozen(address account, bool frozen) external onlyOwner {
        frozenAccounts[account] = frozen;
        emit AccountFrozen(account, frozen);
    }

    // 異常取引の閾値設定
    function setSuspiciousWithdrawalThreshold(uint256 newThreshold) external onlyOwner {
        uint256 oldThreshold = suspiciousWithdrawalThreshold;
        suspiciousWithdrawalThreshold = newThreshold;
        emit SuspiciousThresholdUpdated(oldThreshold, newThreshold);
    }

    // 運用ウォレットの設定
    function setOperationalWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        operationalWallet = _wallet;
        emit OperationalWalletUpdated(_wallet);
    }

    // 最低維持残高の設定
    function setMinContractBalance(uint256 _amount) external onlyOwner {
        minContractBalance = _amount;
        emit MinContractBalanceUpdated(_amount);
    }

    // 運用資金の調整
    function adjustOperationalFunds(uint256 amount) external onlyOwner {
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        require(contractBalance.sub(amount) >= minContractBalance, "Insufficient reserve");
        require(usdcToken.transfer(operationalWallet, amount), "Transfer failed");
        emit OperationalFundsAdjusted(amount, true);
    }

    // 運用資金の返還
    function returnOperationalFunds(uint256 amount) external {
        require(msg.sender == operationalWallet, "Only operational wallet");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit OperationalFundsAdjusted(amount, false);
    }

    // 管理者用：統計情報の取得
    function getDetailedStats() external view onlyOwner returns (
        uint256 totalDeposits,
        uint256 totalUsers,
        uint256 totalFrozenAccounts,
        uint256 contractBalance,
        uint256 operationalBalance
    ) {
        uint256 frozenCount = 0;
        for (uint256 i = 0; i < rankCount; i++) {
            address user = dailyActiveUsers[block.timestamp / 86400][i];
            if (frozenAccounts[user]) {
                frozenCount++;
            }
        }

        return (
            usdcToken.balanceOf(address(this)),
            rankCount,
            frozenCount,
            usdcToken.balanceOf(address(this)),
            operationalWallet != address(0) ? usdcToken.balanceOf(operationalWallet) : 0
        );
    }

    // 管理者用：異常行動検知
    function getSuspiciousUsers() external view onlyOwner returns (address[] memory) {
        uint256 count = 0;
        address[] memory users = dailyActiveUsers[block.timestamp / 86400];
        address[] memory suspiciousUsers = new address[](users.length);
        
        for (uint256 i = 0; i < users.length; i++) {
            if (userActivities[users[i]].dailyWithdrawCount >= suspiciousWithdrawalThreshold) {
                suspiciousUsers[count] = users[i];
                count++;
            }
        }
        
        // 配列のサイズを実際のカウント数に調整
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = suspiciousUsers[i];
        }
        return result;
    }
    // ユーティリティ関数：ユーザーアクティビティの更新
    function updateUserActivity(address user, string memory actionType) internal {
        UserActivity storage activity = userActivities[user];
        
        if (block.timestamp >= activity.lastActionTimestamp + 24 hours) {
            activity.dailyWithdrawCount = 0;
        }
        
        if (keccak256(abi.encodePacked(actionType)) == keccak256(abi.encodePacked("withdraw"))) {
            activity.dailyWithdrawCount++;
            
            if (activity.dailyWithdrawCount >= suspiciousWithdrawalThreshold) {
                emit SuspiciousActivity(
                    user,
                    "excessive_withdrawals",
                    activity.dailyWithdrawCount,
                    block.timestamp
                );
            }
        }
        
        activity.lastActionTimestamp = block.timestamp;
        dailyActiveUsers[block.timestamp / 86400].push(user);
    }

    // イベント定義
    event Deposit(
        address indexed user,
        uint256 amount
    );

    event Withdrawal(
        address indexed user,
        uint256 amount
    );

    event DepositRewardClaimed(
        address indexed user,
        uint256 reward,
        uint256 bonusAmount,
        uint256 totalAccumulatedRewards
    );

    event ReferralRewardClaimed(
        address indexed user,
        uint256 amount
    );

    event ReferralCodeCreated(
        address indexed user,
        uint256 referralCode
    );

    event ReferralProcessed(
        address indexed user,
        address indexed referrer,
        uint256 referralCode
    );

    event APRUpdated(
        uint256 newAPR
    );

    event ReferralRewardRateUpdated(
        uint256 referrerRate,
        uint256 referredRate
    );

    event RankAdded(
        uint256 indexed rankId,
        string name,
        uint256 threshold,
        uint256 bonusRate,
        bool isActive
    );

    event RankRemoved(
        uint256 indexed rankId,
        string name
    );

    event RankConfigUpdated(
        uint256 indexed rankId,
        string name,
        uint256 threshold,
        uint256 bonusRate,
        bool isActive
    );

    event PauseStatusChanged(
        string functionType,
        bool isPaused
    );

    event AccountFrozen(
        address indexed account,
        bool frozen
    );

    event SuspiciousActivity(
        address indexed user,
        string activityType,
        uint256 count,
        uint256 timestamp
    );

    event SuspiciousThresholdUpdated(
        uint256 oldThreshold,
        uint256 newThreshold
    );

    event OperationalWalletUpdated(
        address newWallet
    );

    event MinContractBalanceUpdated(
        uint256 newMinBalance
    );

    event OperationalFundsAdjusted(
        uint256 amount,
        bool isWithdrawal
    );
}
